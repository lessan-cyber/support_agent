import uuid

from pydantic import BaseModel

from app.models.message import SenderType


class ChatMessage(BaseModel):
    content: str


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
    answer: str
    notify_email: bool = True


class AdminResolveResponse(BaseModel):
    """Response model for ticket resolution."""
    success: bool
    message: str
    ticket_id: uuid.UUID
