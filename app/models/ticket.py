"""Ticket model for tracking support requests."""

import enum
import uuid

from sqlalchemy import Enum as EnumType
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class TicketStatus(enum.Enum):
    OPEN = "open"
    PENDING_HUMAN = "pending_human"
    RESOLVED = "resolved"


class Ticket(BaseModel):
    __tablename__ = "tickets"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[TicketStatus] = mapped_column(
        EnumType(TicketStatus, name="ticket_status"),
        nullable=False,
        default=TicketStatus.OPEN,
    )
    user_email: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        comment="Email of the user who initiated the ticket, if available.",
    )

    def __repr__(self) -> str:
        return f"<Ticket(id={self.id}, status='{self.status.value}')>"
