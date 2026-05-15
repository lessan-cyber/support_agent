"""Ticket admin endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_rls_session
from app.models.message import Message, SenderType
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User
from app.schemas.chat import AdminResolveRequest
from app.services.cache import semantic_cache
from app.services.email import send_resolution_email
from app.services.embeddings import get_embedding_model
from app.utils.logging_config import logger

router = APIRouter()


@router.post("/{ticket_id}/resume", response_model=dict)
async def resume_ticket(
    ticket_id: uuid.UUID,
    resume_request: AdminResolveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
):
    """
    Resolve an escalated ticket with a human-provided answer.

    Does NOT resume the LangGraph thread — the graph replay on resume re-executes
    generation and confidence nodes which can produce stale/incorrect results.
    Instead, directly saves the human answer, updates ticket status, and caches
    the response for future use.

    Only authenticated admin users with proper tenant access can resolve tickets.

    Args:
        ticket_id: The ID of the ticket to resolve
        resume_request: Contains human agent's answer and notification preferences
        current_user: Authenticated admin user
        db: RLS-scoped database session

    Returns:
        Confirmation of successful resolution
    """
    logger.info(f"Resolving ticket {ticket_id}")

    try:
        result = await db.execute(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.tenant_id == current_user.tenant_id,
            )
        )
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

        ticket.status = TicketStatus.RESOLVED
        logger.info(f"Ticket {ticket_id} marked as RESOLVED")

        human_message = Message(
            ticket_id=ticket_id,
            tenant_id=ticket.tenant_id,
            sender_type=SenderType.HUMAN_AGENT,
            content=resume_request.answer,
        )
        db.add(human_message)
        await db.commit()

        try:
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
                embedding_model = get_embedding_model()
                question_embedding = await embedding_model.aembed_query(
                    original_question
                )

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

        if resume_request.notify_email and ticket.user_email:
            try:
                await send_resolution_email(
                    user_email=ticket.user_email,
                    ticket_id=str(ticket_id),
                    answer=resume_request.answer,
                )
            except Exception as e:
                logger.error(f"Failed to send resolution email: {e}", exc_info=True)
        elif resume_request.notify_email and not ticket.user_email:
            logger.warning(f"Cannot send email for ticket {ticket_id}: no user email on ticket")

        return {
            "success": True,
            "message": "Ticket resolved successfully",
            "ticket_id": str(ticket_id),
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to resolve ticket {ticket_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resolve ticket",
        ) from e
