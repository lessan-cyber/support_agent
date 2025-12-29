"""Admin API endpoints for ticket management and human-in-the-loop resolution."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from langgraph.types import Command
from sqlalchemy import select, update
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
from app.schemas.chat import AdminResolveRequest
from app.services.cache import semantic_cache
from app.services.embeddings import get_embedding_model
from app.utils.logging_config import logger

router = APIRouter()


@router.post("/tickets/{ticket_id}/email", response_model=dict)
async def add_user_email_to_ticket(
    ticket_id: uuid.UUID,
    email_request: dict,
    chat_session: tuple[AsyncSession, str, uuid.UUID] = Depends(get_chat_session),
):
    """
    Add user email to an escalated ticket.

    This endpoint is called by frontend (public chat widget) when a user
    provides their email during escalation process. Uses same authentication
    as chat streaming routes (anonymous customer JWT).

    Args:
        ticket_id: The ID of the ticket
        email_request: Dictionary with 'email' key
        chat_session: RLS-scoped session, tenant_id, and ticket_id from JWT

    Returns:
        Dictionary with success status
    """
    logger.info(f"Adding email to ticket {ticket_id}")

    # Validate chat token and get tenant_id
    db, tenant_id_val, ticket_id_val = chat_session

    # Verify ticket_id in JWT matches path parameter
    if ticket_id_val != ticket_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Ticket ID mismatch"
        )

    user_email = email_request.get("email")
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required"
        )

    stmt = update(Ticket).where(Ticket.id == ticket_id).values(user_email=user_email)
    result = await db.execute(stmt)

    if result.rowcount == 0:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found or not accessible",
        )

    await db.commit()

    logger.info(f"Added email {user_email} to ticket {ticket_id}")

    return {
        "success": True,
        "message": "Email added successfully",
        "ticket_id": str(ticket_id),
    }


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
