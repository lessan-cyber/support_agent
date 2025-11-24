"""User model."""

import enum
import uuid

from sqlalchemy import Enum as EnumType
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.tenant import Tenant


class UserRole(enum.Enum):
    ADMIN = "admin"
    AGENT = "agent"


class User(BaseModel):
    __tablename__ = "users"

    # This ID is populated with the ID from Supabase's auth.users table.
    # The foreign key constraint is removed from the model to simplify
    # Alembic migrations, as auth.users is not managed by our application's metadata.
    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        comment="Corresponds to the id of the user in Supabase auth.users.",
    )
    role: Mapped[UserRole] = mapped_column(
        EnumType(UserRole, name="user_role"),
        nullable=False,
        default=UserRole.AGENT,
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="users")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, role='{self.role.value}')>"
