"""Conversation list and message history admin endpoints."""

import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func, select, true
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_rls_session
from app.models.message import Message
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User
from app.schemas.chat import (
    ChatMessageItem,
    ConversationListItem,
    ConversationListQueryParams,
    ConversationListResponse,
    ConversationMessagesResponse,
)
from app.utils.logging_config import logger

router = APIRouter()


@router.get("", response_model=ConversationListResponse)
async def get_conversation_list(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
    params: ConversationListQueryParams = Depends(),
) -> ConversationListResponse:
    """
    Get conversation list for the current tenant (sidebar view).

    Returns ticket metadata with latest message preview.
    Uses LATERAL joins to avoid scanning all messages.
    """
    logger.info(
        f"Admin {current_user.id} requesting conversation list for tenant {current_user.tenant_id}"
    )

    try:
        filters = [Ticket.tenant_id == current_user.tenant_id]
        if params.client_email:
            filters.append(Ticket.user_email == params.client_email)
        if params.status:
            try:
                status_filter = TicketStatus(params.status)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid status filter: {params.status}",
                ) from e
            filters.append(Ticket.status == status_filter)
        if params.start_date:
            try:
                start_date_obj = datetime.fromisoformat(params.start_date).date()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid start_date format: '{params.start_date}'. Expected ISO date (e.g. 2024-01-15).",
                )
            filters.append(Ticket.created_at >= start_date_obj)
        if params.end_date:
            try:
                end_date_obj = datetime.fromisoformat(
                    params.end_date
                ).date() + timedelta(days=1)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid end_date format: '{params.end_date}'. Expected ISO date (e.g. 2024-01-15).",
                )
            filters.append(Ticket.created_at <= end_date_obj)

        count_query = select(func.count()).select_from(Ticket).where(and_(*filters))
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0

        if total_count == 0:
            return ConversationListResponse(
                conversations=[],
                total_count=0,
                limit=params.limit,
                offset=params.offset,
            )

        latest_message = (
            select(
                Message.content.label("last_message_content"),
                Message.sender_type.label("last_message_sender"),
                Message.created_at.label("last_message_at"),
            )
            .where(Message.ticket_id == Ticket.id)
            .order_by(Message.created_at.desc())
            .limit(1)
            .lateral("latest_message")
        )

        message_count = (
            select(func.count().label("message_count"))
            .where(Message.ticket_id == Ticket.id)
            .lateral("message_count")
        )

        query = (
            select(
                Ticket.id,
                Ticket.status,
                Ticket.user_email,
                Ticket.created_at,
                message_count.c.message_count,
                latest_message.c.last_message_content,
                latest_message.c.last_message_sender,
                latest_message.c.last_message_at,
            )
            .select_from(Ticket)
            .outerjoin(latest_message, true())
            .outerjoin(message_count, true())
            .where(and_(*filters))
            .order_by(Ticket.created_at.desc())
            .limit(params.limit)
            .offset(params.offset)
        )

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
        ) from e


@router.get(
    "/{ticket_id}/messages",
    response_model=ConversationMessagesResponse,
)
async def get_conversation_messages(
    ticket_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
) -> ConversationMessagesResponse:
    """
    Get all messages for a specific conversation (chat view).

    Returns messages in chronological order for rendering in a chat UI.
    """
    logger.info(f"Admin {current_user.id} requesting messages for ticket {ticket_id}")

    try:
        ticket_result = await db.execute(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.tenant_id == current_user.tenant_id,
            )
        )
        ticket = ticket_result.scalar_one_or_none()

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )

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
        ) from e
