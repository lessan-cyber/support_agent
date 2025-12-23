"""Utility for generating JWT tokens for anonymous chat sessions."""

import uuid
from datetime import datetime, timedelta, timezone

import jwt
from uuid_extensions import uuid7

from app.settings import settings


def create_chat_session_jwt(tenant_id: str, ticket_id: str) -> str:
    """
    Creates a JWT token for an anonymous chat session.

    Args:
        tenant_id (str): The ID of the tenant.
        ticket_id (str): The ID of the chat ticket.

    Returns:
        str: The encoded JWT token.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "iat": now,
        "exp": now + timedelta(hours=settings.CHAT_SESSION_EXPIRE_HOURS),
        "sub": f"anon_{uuid7()}",
        "role": "customer",
        "tenant_id": tenant_id,
        "ticket_id": ticket_id,
    }
    token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    return token
