"""Admin API endpoints for ticket management and human-in-the-loop resolution."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from langgraph.types import Command
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.constructor import get_runnable
from app.api.deps import (
    get_current_user,
    get_rls_session,
)
from app.models.message import Message, SenderType
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User
from app.schemas.chat import (
    AdminResolveRequest,
    ChatMessageItem,
    ConversationListItem,
    ConversationListQueryParams,
    ConversationListResponse,
    ConversationMessagesResponse,
)
from app.schemas.document import DocumentListResponse
from app.services.cache import semantic_cache
from app.services.document import document_service
from app.services.embeddings import get_embedding_model
from app.utils.logging_config import logger

router = APIRouter()


@router.post("/tickets/{ticket_id}/resume", response_model=dict)
async def resume_ticket(
    ticket_id: uuid.UUID,
    resume_request: AdminResolveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
):
    """
    Resume a paused LangGraph thread with human-provided answer.

    This endpoint uses strict authentication (internal admin users) similar to
    document routes. Only authenticated admin users with proper tenant access
    can resume tickets.

    Args:
        ticket_id: The ID of the ticket to resume
        resume_request: Contains human agent's answer and notification preferences
        current_user: Authenticated admin user
        db: RLS-scoped database session

    Returns:
        Confirmation of successful resume
    """
    logger.info(f"Resuming ticket {ticket_id}")

    try:
        # 1. Validate ticket status (RLS ensures tenant isolation)
        result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
        ticket = result.scalar_one_or_none()

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found"
            )

        if ticket.status != TicketStatus.PENDING_HUMAN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ticket is not in pending_human status. Current status: {ticket.status}",
            )

        # 2. Resume LangGraph thread with human's answer
        runnable = get_runnable()
        config = {"configurable": {"thread_id": str(ticket_id)}}

        logger.info(f"Resuming graph for ticket {ticket_id} with answer")
        _final_state = await runnable.ainvoke(
            Command(resume=resume_request.answer),
            config=config,  # type: ignore
        )

        logger.info(f"Graph resumed successfully for ticket {ticket_id}")

        # 3. Update ticket status to RESOLVED
        ticket.status = TicketStatus.RESOLVED
        await db.commit()

        logger.info(f"Ticket {ticket_id} marked as RESOLVED")

        # 4. Save human agent's response to message history
        human_message = Message(
            ticket_id=ticket_id,
            tenant_id=ticket.tenant_id,
            sender_type=SenderType.HUMAN_AGENT,
            content=resume_request.answer,
        )
        db.add(human_message)
        await db.commit()

        # 5. Update semantic cache with human-provided answer
        # This implements "self-improving loop" - human answers are cached for future use
        try:
            # Get original question from ticket's message history
            message_query = (
                select(Message.content)
                .where(
                    Message.ticket_id == ticket_id,
                    Message.sender_type == SenderType.USER,
                )
                .order_by(Message.created_at.desc())
                .limit(1)
            )

            message_result = await db.execute(message_query)
            original_question = message_result.scalar()

            if original_question:
                # Generate embedding for original question
                embedding_model = get_embedding_model()
                question_embedding = await embedding_model.aembed_query(
                    original_question
                )

                # Cache human answer with original question embedding
                # This ensures similar future questions will benefit from this human expertise
                await semantic_cache.cache_response(
                    tenant_id=str(ticket.tenant_id),
                    query_embedding=question_embedding,
                    query_text=original_question,
                    response=resume_request.answer,
                )
                logger.info(
                    f"Cached human resolution for question: '{original_question[:50]}...' for future use"
                )
            else:
                logger.warning(
                    f"Could not find original question for ticket {ticket_id}"
                )
        except Exception as e:
            logger.error(f"Failed to cache human resolution: {e}", exc_info=True)
            # Don't fail main flow if caching fails

        # 6. Optionally send email notification (placeholder for future implementation)
        if resume_request.notify_email:
            logger.info(f"Email notification requested for ticket {ticket_id}")
            # TODO: Implement actual email sending

        return {
            "success": True,
            "message": "Ticket resumed successfully",
            "ticket_id": str(ticket_id),
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to resume ticket {ticket_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resume ticket",
        )


@router.get("/documents", response_model=DocumentListResponse)
async def get_tenant_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
):
    """
    Get all documents uploaded in the current tenant.

    This endpoint allows admins to view all files uploaded within their tenant.
    Implements proper RLS to prevent cross-tenant access.

    Args:
        current_user: Authenticated admin user (RLS context set by dependency)
        db: RLS-scoped database session

    Returns:
        DocumentListResponse with list of documents and count

    Raises:
        HTTPException 500: If unexpected error occurs
    """
    logger.info(
        f"Admin {current_user.id} requesting all documents for tenant {current_user.tenant_id}"
    )

    try:
        # Get all documents for the tenant using service layer
        documents = await document_service.get_tenant_files(
            tenant_id=current_user.tenant_id,
            db=db,
        )

        return DocumentListResponse(
            documents=documents,
            count=len(documents),
        )

    except Exception as e:
        logger.error(f"Unexpected error retrieving documents: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve documents",
        )


@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversation_list(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
    params: ConversationListQueryParams = Depends(),
):
    """
    Get conversation list for the current tenant (sidebar view).

    Returns ticket metadata with latest message preview.
    Uses window function to avoid N+1 query problem.

    Args:
        current_user: Authenticated admin user (RLS context set by dependency)
        db: RLS-scoped database session
        params: Query parameters (client_email, status, date ranges, pagination)

    Returns:
        ConversationListResponse with conversation list items
    """
    logger.info(
        f"Admin {current_user.id} requesting conversation list for tenant {current_user.tenant_id}"
    )

    try:
        # Subquery: rank messages per ticket by recency
        latest_message_subquery = select(
            Message.ticket_id,
            Message.content,
            Message.sender_type,
            Message.created_at,
            func.row_number()
            .over(
                partition_by=Message.ticket_id,
                order_by=Message.created_at.desc(),
            )
            .label("rn"),
        ).subquery("latest_messages")

        # Main query: tickets with latest message and count in single query
        query = (
            select(
                Ticket.id,
                Ticket.status,
                Ticket.user_email,
                Ticket.created_at,
                func.count(Message.id).label("message_count"),
                latest_message_subquery.c.content.label("last_message_content"),
                latest_message_subquery.c.sender_type.label("last_message_sender"),
                latest_message_subquery.c.created_at.label("last_message_at"),
            )
            .outerjoin(Message, Message.ticket_id == Ticket.id)
            .outerjoin(
                latest_message_subquery,
                and_(
                    Ticket.id == latest_message_subquery.c.ticket_id,
                    latest_message_subquery.c.rn == 1,
                ),
            )
            .group_by(
                Ticket.id,
                Ticket.status,
                Ticket.user_email,
                Ticket.created_at,
                latest_message_subquery.c.content,
                latest_message_subquery.c.sender_type,
                latest_message_subquery.c.created_at,
            )
        )

        # Apply filters
        filters = []
        if params.client_email:
            filters.append(Ticket.user_email == params.client_email)
        if params.status:
            filters.append(Ticket.status == params.status)
        if params.start_date:
            start_date_obj = datetime.fromisoformat(params.start_date).date()
            filters.append(Ticket.created_at >= start_date_obj)
        if params.end_date:
            end_date_obj = datetime.fromisoformat(params.end_date).date()
            filters.append(Ticket.created_at <= end_date_obj)

        if filters:
            query = query.where(and_(*filters))

        # Get total count before pagination
        count_subquery = query.subquery()
        count_query = select(func.count()).select_from(count_subquery)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        # Apply ordering and pagination
        query = query.order_by(Ticket.created_at.desc())
        query = query.limit(params.limit).offset(params.offset)

        # Execute
        result = await db.execute(query)
        rows = result.all()

        conversations = [
            ConversationListItem(
                ticket_id=row.id,
                status=row.status,
                user_email=row.user_email,
                created_at=row.created_at.isoformat(),
                message_count=row.message_count,
                last_message_at=row.last_message_at.isoformat()
                if row.last_message_at
                else None,
                last_message_content=row.last_message_content,
                last_message_sender=row.last_message_sender,
            )
            for row in rows
        ]

        return ConversationListResponse(
            conversations=conversations,
            total_count=total_count,
            limit=params.limit,
            offset=params.offset,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve conversation list: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation list",
        )


@router.get(
    "/conversations/{ticket_id}/messages",
    response_model=ConversationMessagesResponse,
)
async def get_conversation_messages(
    ticket_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
):
    """
    Get all messages for a specific conversation (chat view).

    Returns messages in chronological order for rendering in a chat UI.
    RLS ensures tenant isolation - only messages from the current tenant
    are accessible.

    Args:
        ticket_id: The ticket/conversation ID
        current_user: Authenticated admin user (RLS context set by dependency)
        db: RLS-scoped database session

    Returns:
        ConversationMessagesResponse with ticket info and ordered messages

    Raises:
        HTTPException 404: If ticket not found
        HTTPException 500: If unexpected error occurs
    """
    logger.info(f"Admin {current_user.id} requesting messages for ticket {ticket_id}")

    try:
        # Verify ticket exists (RLS ensures tenant isolation)
        ticket_result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
        ticket = ticket_result.scalar_one_or_none()

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )

        # Get all messages ordered chronologically for chat display
        messages_query = (
            select(Message)
            .where(Message.ticket_id == ticket_id)
            .order_by(Message.created_at.asc())
        )

        messages_result = await db.execute(messages_query)
        messages = messages_result.scalars().all()

        return ConversationMessagesResponse(
            ticket_id=ticket.id,
            status=ticket.status,
            user_email=ticket.user_email,
            messages=[
                ChatMessageItem(
                    id=msg.id,
                    sender_type=msg.sender_type,
                    content=msg.content,
                    created_at=msg.created_at.isoformat(),
                )
                for msg in messages
            ],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to retrieve messages for ticket {ticket_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve messages",
        )
