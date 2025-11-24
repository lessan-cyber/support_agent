"""Tenant model."""

import uuid
from typing import List

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Tenant(BaseModel):
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    plan: Mapped[str] = mapped_column(String(100), nullable=True, default="free")

    # Relationship to users within the same tenant
    users: Mapped[List["User"]] = relationship(
        "User", back_populates="tenant", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Tenant(id={self.id}, name='{self.name}')>"
