import uuid

from pydantic import BaseModel, Field, field_validator
from typing import Optional

from app.models.message import SenderType
from app.models.ticket import TicketStatus


class ChatMessage(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="User message content (1-10000 characters)",
    )


class InitChatRequest(BaseModel):
    tenant_id: uuid.UUID


class InitChatResponse(BaseModel):
    token: str


class MessageResponse(BaseModel):
    """Pydantic model for serializing SQLAlchemy Message objects."""

    id: uuid.UUID
    tenant_id: uuid.UUID
    ticket_id: uuid.UUID
    sender_type: SenderType
    content: str

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: list[MessageResponse]

    class Config:
        from_attributes = True


class AdminResolveRequest(BaseModel):
    """Request model for resolving an escalated ticket."""

    answer: str = Field(
        ...,
        min_length=10,
        max_length=10000,
        description="Human agent's answer (10-10000 characters)",
    )
    notify_email: bool = True


class AdminResolveResponse(BaseModel):
    """Response model for ticket resolution."""

    success: bool
    message: str
    ticket_id: uuid.UUID


class ConversationHistoryItem(BaseModel):
    """Conversation history item with metadata and message preview."""

    ticket_id: uuid.UUID
    status: str
    user_email: str | None
    created_at: str
    last_message_at: str | None
    message_count: int
    last_message_preview: str | None
    last_message_sender: SenderType | None

    class Config:
        from_attributes = True


class ConversationHistoryQueryParams(BaseModel):
    """Query parameters for conversation history endpoint."""

    client_email: str | None = Field(
        None,
        description="Filter conversations by client email address",
        max_length=255,
    )
    status: str | None = Field(
        None,
        description=f"Filter by ticket status: {', '.join([s.value for s in TicketStatus])}",
    )
    start_date: str | None = Field(
        None,
        description="Start date for filtering (YYYY-MM-DD format)",
        pattern=r"^\d{4}-\d{2}-\d{2}$",
    )
    end_date: str | None = Field(
        None,
        description="End date for filtering (YYYY-MM-DD format)",
        pattern=r"^\d{4}-\d{2}-\d{2}$",
    )
    limit: int = Field(
        50,
        description="Number of results per page",
        ge=1,
        le=500,
    )
    offset: int = Field(
        0,
        description="Pagination offset",
        ge=0,
    )

    class Config:
        from_attributes = True


class ConversationHistoryResponse(BaseModel):
    """Response model for conversation history."""

    conversations: list[ConversationHistoryItem]
    total_count: int
    limit: int
    offset: int
