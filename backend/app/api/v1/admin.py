"""Admin API endpoints for ticket management and human-in-the-loop resolution."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from langgraph.types import Command
from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.constructor import get_runnable
from app.api.deps import (
    get_chat_session,
    get_current_user,
    get_rls_session,
)
from app.models.message import Message, SenderType
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User
from app.schemas.chat import (
    AdminResolveRequest,
    ConversationHistoryQueryParams,
    ConversationHistoryResponse,
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


@router.get("/conversations", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
    params: ConversationHistoryQueryParams = Depends(),
):
    """
    Get conversation history for the current tenant.

    This endpoint allows admins to view all conversations within their tenant.
    Supports filtering by client email, ticket status, and date ranges.
    Implements proper RLS to prevent cross-tenant access.

    Args:
        current_user: Authenticated admin user (RLS context set by dependency)
        db: RLS-scoped database session
        params: Query parameters (client_email, status, date ranges, pagination)

    Returns:
        ConversationHistoryResponse with conversation history items

    Raises:
        HTTPException 400: If invalid parameters provided
        HTTPException 500: If unexpected error occurs
    """
    logger.info(
        f"Admin {current_user.id} requesting conversation history for tenant {current_user.tenant_id}"
    )

    try:
        # Extract parameters from validated Pydantic model
        client_email = params.client_email
        status = params.status
        start_date = params.start_date
        end_date = params.end_date
        limit = params.limit
        offset = params.offset

        # Convert date strings to date objects if provided
        start_date_obj = (
            datetime.fromisoformat(start_date).date() if start_date else None
        )
        end_date_obj = datetime.fromisoformat(end_date).date() if end_date else None

        # Build base query for tickets with message counts
        ticket_query = (
            select(
                Ticket.id,
                Ticket.status,
                Ticket.user_email,
                Ticket.created_at,
                func.count(Message.id).label("message_count"),
                func.max(Message.created_at).label("last_message_at"),
                func.max(Message.content).label("last_message_preview"),
                func.max(Message.sender_type).label("last_message_sender"),
            )
            .join(Message, Message.ticket_id == Ticket.id, isouter=True)
            .where(Ticket.tenant_id == current_user.tenant_id)
            .group_by(Ticket.id, Ticket.status, Ticket.user_email, Ticket.created_at)
        )

        # Apply filters
        filters = []
        if client_email:
            filters.append(Ticket.user_email == client_email)
        if status:
            filters.append(Ticket.status == status)
        if start_date_obj:
            filters.append(Ticket.created_at >= start_date_obj)
        if end_date_obj:
            filters.append(Ticket.created_at <= end_date_obj)

        if filters:
            ticket_query = ticket_query.where(and_(*filters))

        # Get total count for pagination
        count_query = select(func.count()).select_from(ticket_query.subquery())
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Apply pagination
        ticket_query = ticket_query.order_by(Ticket.created_at.desc())
        ticket_query = ticket_query.limit(limit).offset(offset)

        # Execute query
        result = await db.execute(ticket_query)
        conversations = result.all()

        # Format response
        conversation_items = []
        for conv in conversations:
            conversation_items.append(
                {
                    "ticket_id": conv[0],
                    "status": conv[1],
                    "user_email": conv[2],
                    "created_at": conv[3].isoformat(),
                    "last_message_at": conv[5].isoformat() if conv[5] else None,
                    "message_count": conv[4],
                    "last_message_preview": conv[6]
                    if conv[6] and len(conv[6]) > 50
                    else conv[6],
                    "last_message_sender": conv[7],
                }
            )

        return ConversationHistoryResponse(
            conversations=conversation_items,
            total_count=total_count,
            limit=limit,
            offset=offset,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve conversation history: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation history",
        )
