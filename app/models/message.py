"""Message model for storing conversation history."""

import enum
import uuid

from sqlalchemy import Enum as EnumType
from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class SenderType(enum.Enum):
    USER = "user"
    AI = "ai"
    HUMAN_AGENT = "human_agent"


class Message(BaseModel):
    __tablename__ = "messages"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ticket_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False
    )
    sender_type: Mapped[SenderType] = mapped_column(
        EnumType(SenderType, name="sender_type"),
        nullable=False,
        default=SenderType.USER,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    def __repr__(self) -> str:
        return f"<Message(id={self.id}, ticket_id={self.ticket_id}, sender='{self.sender_type.value}')>"
