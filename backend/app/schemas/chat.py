import uuid

from pydantic import BaseModel, Field, field_validator

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


class ConversationListItem(BaseModel):
    """Conversation list item with preview metadata for sidebar view."""

    ticket_id: uuid.UUID
    status: TicketStatus
    user_email: str | None
    created_at: str
    message_count: int
    last_message_at: str | None
    last_message_content: str | None
    last_message_sender: SenderType | None


class ConversationListQueryParams(BaseModel):
    """Query parameters for conversation list endpoint."""

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

    @field_validator("status")
    def validate_status(cls, value: str | None) -> str | None:
        """Validate that status is either None or a valid TicketStatus value."""
        if value is None:
            return None

        valid_statuses = {s.value for s in TicketStatus}
        if value not in valid_statuses:
            raise ValueError(
                f"Invalid status '{value}'. Must be one of: {', '.join(valid_statuses)}"
            )
        return value


class ConversationListResponse(BaseModel):
    """Response model for conversation list."""

    conversations: list[ConversationListItem]
    total_count: int
    limit: int
    offset: int


class ChatMessageItem(BaseModel):
    """Individual message in a conversation for chat view."""

    id: uuid.UUID
    sender_type: SenderType
    content: str
    created_at: str


class ConversationMessagesResponse(BaseModel):
    """Response model for full conversation messages (chat view)."""

    ticket_id: uuid.UUID
    status: TicketStatus
    user_email: str | None
    messages: list[ChatMessageItem]
