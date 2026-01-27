"""Chat API endpoints for public widget."""

import json
import uuid

from fastapi import APIRouter, Depends, Request, status
from fastapi.exceptions import HTTPException
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.constructor import stream_response as agent_stream_response
from app.api.deps import get_chat_session, get_db_session
from app.config.db import SessionLocal
from app.models.message import Message, SenderType
from app.models.ticket import Ticket
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatMessage,
    InitChatRequest,
    InitChatResponse,
)
from app.utils.jwt_manager import create_chat_session_jwt
from app.utils.limiter import limiter
from app.utils.logging_config import logger
from app.utils.tenant_validator import validate_tenant_and_origin

router = APIRouter()


@router.post("/init", response_model=InitChatResponse)
@limiter.limit("10/minute")
async def init_chat(
    request: Request,
    chat_request: InitChatRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Initialize a new chat session.
    1. Validates origin domain.
    2. Creates a new ticket.
    3. Issues a JWT for anonymous session.
    """
    tenant = await validate_tenant_and_origin(
        request=request, tenant_id=str(chat_request.tenant_id), db_session=db
    )
    new_ticket = Ticket(tenant_id=tenant.id)
    db.add(new_ticket)
    await db.commit()
    await db.refresh(new_ticket)
    token = create_chat_session_jwt(
        tenant_id=str(tenant.id), ticket_id=str(new_ticket.id)
    )
    return InitChatResponse(token=token)


@router.get("/history", response_model=ChatHistoryResponse)
@limiter.limit("30/minute")
async def get_history(
    request: Request,
    chat_session: tuple[AsyncSession, str, uuid.UUID] = Depends(get_chat_session),
):
    """
    Retrieve chat history for current session.
    """
    db_session, _, ticket_id = chat_session
    query = (
        select(Message)
        .where(Message.ticket_id == ticket_id)
        .order_by(Message.created_at.asc())
    )
    result = await db_session.execute(query)
    messages = result.scalars().all()

    return ChatHistoryResponse(messages=messages)


@router.post("/tickets/{ticket_id}/email", response_model=dict)
@limiter.limit("10/minute")
async def add_user_email_to_ticket(
    request: Request,
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

    # Basic email validation
    if "@" not in user_email or "." not in user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format"
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


@router.post("/stream")
@limiter.limit("60/minute")
async def send_message(
    request: Request,
    content: ChatMessage,
    chat_session: tuple[AsyncSession, str, uuid.UUID] = Depends(get_chat_session),
):
    """
    Saves user message, streams agent's response, and then saves to
    full AI response.
    """
    db_session, tenant_id, ticket_id = chat_session

    try:
        user_message = Message(
            tenant_id=uuid.UUID(tenant_id),
            ticket_id=ticket_id,
            sender_type=SenderType.USER,
            content=content.content,
        )
        db_session.add(user_message)
        await db_session.commit()

        async def response_wrapper():
            full_response = ""
            error_occurred = False

            try:
                agent_generator = agent_stream_response(
                    message=content.content,
                    tenant_id=tenant_id,
                    ticket_id=str(ticket_id),
                )

                async for chunk_str in agent_generator:
                    yield f"data: {chunk_str}\n\n"
                    try:
                        chunk_data = json.loads(chunk_str)
                        if chunk_data.get("type") == "token":
                            full_response += chunk_data.get("content", "")
                        elif chunk_data.get("type") == "error":
                            error_occurred = True
                            logger.error(
                                f"Agent error: {chunk_data.get('content', '')}"
                            )
                    except json.JSONDecodeError:
                        continue

            except Exception as e:
                logger.error(f"Streaming error in response_wrapper: {e}", exc_info=True)
                yield f"data: {json.dumps({'type': 'error', 'content': 'An error occurred during processing'})}\n\n"
                error_occurred = True
            finally:
                if full_response and not error_occurred:
                    try:
                        async with SessionLocal() as new_db_session:
                            await new_db_session.execute(
                                text(
                                    "SELECT set_config('app.current_tenant', :tenant_id, true)"
                                ),
                                {"tenant_id": tenant_id},
                            )
                            ai_message = Message(
                                tenant_id=uuid.UUID(tenant_id),
                                ticket_id=ticket_id,
                                sender_type=SenderType.AI,
                                content=full_response.strip(),
                            )
                            new_db_session.add(ai_message)
                            await new_db_session.commit()
                    except Exception as db_error:
                        logger.error(
                            f"Failed to save AI message: {db_error}", exc_info=True
                        )

        return StreamingResponse(response_wrapper(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Failed to process chat message: {e}", exc_info=True)
        await db_session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process your message",
        ) from e
