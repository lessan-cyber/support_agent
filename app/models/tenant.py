"""Tenant model."""

import re
from typing import TYPE_CHECKING

from sqlalchemy import ARRAY, String, event
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class Tenant(BaseModel):
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    plan: Mapped[str] = mapped_column(String(100), nullable=True, default="free")
    allowed_domains: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=True, default=list
    )

    # Relationship to users within the same tenant
    # pyrefly: ignore [unknown-name]
    users: Mapped[list["User"]] = relationship(
        "User", back_populates="tenant", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Tenant(id={self.id}, name='{self.name}')>"


def validate_allowed_domains(mapper, connection, target):
    """
    Validates and sanitizes the allowed_domains list.
    Strips whitespace and URL schemes, then checks against a domain regex.
    """
    if not target.allowed_domains:
        return

    cleaned_domains = []
    # Regex for a valid domain name (simplified)
    # Allows subdomains, requires at least one dot, ends with 2+ letters
    domain_regex = re.compile(
        r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
    )

    for domain in target.allowed_domains:
        if not domain:
            continue

        # Strip whitespace
        s_domain = domain.strip()

        # Strip scheme (http://, https://)
        s_domain = re.sub(r"^https?://", "", s_domain)

        # Strip trailing path/query if passed by mistake (e.g. example.com/path)
        s_domain = s_domain.split("/")[0]

        if not domain_regex.match(s_domain):
            raise ValueError(f"Invalid domain format: '{domain}' (sanitized: '{s_domain}')")

        cleaned_domains.append(s_domain)

    # Update the list with sanitized values
    target.allowed_domains = cleaned_domains


# Register event listeners
event.listen(Tenant, "before_insert", validate_allowed_domains)
event.listen(Tenant, "before_update", validate_allowed_domains)
