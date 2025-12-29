"""Base model for all other models to inherit from."""

import uuid
from datetime import datetime

from sqlalchemy import func, text
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from uuid_extensions import uuid7


class Base(DeclarativeBase):
    """Base for all models."""

    pass


class TimestampMixin:
    """Mixin to add created_at and updated_at timestamps to a model."""

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="The time the record was created.",
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="The time the record was last updated.",
    )


class BaseModel(Base, TimestampMixin):
    """
    Base model for all other models to inherit from.
    It includes a UUID primary key and timestamps.
    """

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid7,
        comment="The unique identifier for the record.",
    )
