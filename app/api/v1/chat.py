import json
import uuid

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.agent.constructor import stream_response as agent_stream_response
from app.api.deps import get_chat_session, get_db_session
from app.config.db import SessionLocal
from app.models.message import Message, SenderType
from app.models.ticket import Ticket
from app.schemas.chat import (
    ChatMessage,
    ChatHistoryResponse,
    InitChatRequest,
    InitChatResponse,
)
from app.utils.jwt_manager import create_chat_session_jwt
from app.utils.tenant_validator import validate_tenant_and_origin

router = APIRouter()


@router.post("/init", response_model=InitChatResponse)
async def init_chat(
    request: Request,
    chat_request: InitChatRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Initialize a new chat session.
    1. Validates the origin domain.
    2. Creates a new ticket.
    3. Issues a JWT for the anonymous session.
    """
    tenant = await validate_tenant_and_origin(
        request=request, tenant_id=str(chat_request.tenant_id), db_session=db
    )
    new_ticket = Ticket(tenant_id=tenant.id)
    db.add(new_ticket)
    await db.commit()
    token = create_chat_session_jwt(
        tenant_id=str(tenant.id), ticket_id=str(new_ticket.id)
    )
    return InitChatResponse(token=token)


@router.get("/history", response_model=ChatHistoryResponse)
async def get_history(
    chat_session: tuple[AsyncSession, str, uuid.UUID] = Depends(get_chat_session),
):
    """
    Retrieve the chat history for the current session.
    """
    db_session, _, ticket_id = chat_session
    print(f"ticket_id: {ticket_id}")
    query = (
         select(Message)
        .where(Message.ticket_id == ticket_id)
        .order_by(Message.created_at.asc())
    )
    result = await db_session.execute(query)
    messages = result.scalars().all()

    return ChatHistoryResponse(messages=messages)


@router.post("/stream")
async def send_message(
    content: ChatMessage,
    chat_session: tuple[AsyncSession, str, uuid.UUID] = Depends(get_chat_session),
):
    """
    Saves the user message, streams the agent's response, and then saves the
    full AI response.
    """
    db_session, tenant_id, ticket_id = chat_session

    # 1. Save user message
    user_message = Message(
        tenant_id=uuid.UUID(tenant_id),
        ticket_id=ticket_id,
        sender_type=SenderType.USER,
        content=content.content,
    )
    db_session.add(user_message)
    await db_session.commit()

    # 2. Define a wrapper generator to stream and save the AI response
    async def response_wrapper():
        full_response = ""
        # Create the agent's response generator
        agent_generator = agent_stream_response(
            message=content.content,
            tenant_id=tenant_id,
            ticket_id=str(ticket_id),
        )

        async for chunk_str in agent_generator:
            yield f"data: {chunk_str}\n\n"
            try:
                # Accumulate the content of "token" events
                chunk_data = json.loads(chunk_str)
                if chunk_data.get("type") == "token":
                    full_response += chunk_data.get("content", "")
            except json.JSONDecodeError:
                # Ignore chunks that are not valid JSON
                continue

        # After the stream is finished, save the full AI response in a new session
        if full_response:
            async with SessionLocal() as new_db_session:
                ai_message = Message(
                    tenant_id=uuid.UUID(tenant_id),
                    ticket_id=ticket_id,
                    sender_type=SenderType.AI,
                    content=full_response.strip(),
                )
                new_db_session.add(ai_message)
                await new_db_session.commit()

    return StreamingResponse(response_wrapper(), media_type="text/event-stream")
