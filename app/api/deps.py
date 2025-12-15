"""Dependencies for API endpoints."""

import logging
import uuid
from typing import AsyncGenerator

import jwt
from fastapi import Depends, HTTPException, Query, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import PyJWTError
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config.db import SessionLocal
from app.models.user import User
from app.settings import settings

reusable_oauth2 = HTTPBearer(scheme_name="Bearer")
optional_oauth2 = HTTPBearer(scheme_name="Bearer", auto_error=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency to get a DB session.
    """
    async with SessionLocal() as session:
        yield session


async def get_current_user(
    request: Request,
    token: HTTPAuthorizationCredentials = Depends(reusable_oauth2),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """
    Dependency to get the current user from the JWT token, attach the RLS-scoped
    session to the request state, and return the user.
    """
    try:
        payload = jwt.decode(
            token.credentials,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Subject not found.",
            )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired."
        ) from None
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}"
        ) from e
    try:
        _user_uuid = uuid.UUID(user_id)
    except ValueError as e:
        logging.warning(f"Malformed user ID in token: {user_id}. Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from e

    result = await db.execute(
        select(User).options(joinedload(User.tenant)).filter(User.id == _user_uuid)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
        )
    _ = user.tenant.id
    await db.execute(
        text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
        {"tenant_id": str(user.tenant_id)},
    )
    request.state.db = db
    db.expunge(user)
    return user


async def get_rls_session(request: Request) -> AsyncSession:
    """
    Dependency that retrieves the RLS-scoped session from the request state.
    """
    db = getattr(request.state, "db", None)
    if db is None:
        raise HTTPException(
            status_code=500, detail="Database session not found in request state."
        )
    return db


async def get_chat_session(
    request: Request,
    # Allow token via Header (Standard) OR Query Param (SSE fallback)
    token: HTTPAuthorizationCredentials | None = Depends(optional_oauth2),
    token_query: str | None = Query(None, alias="token"),
) -> AsyncGenerator[tuple[AsyncSession, str, uuid.UUID], None]:
    """
    Dependency to decode the anonymous customer JWT, set up an RLS-scoped session,
    and yield the session, tenant_id, and ticket_id.
    """
    actual_token = token.credentials if token else token_query
    if not actual_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing session token")

    try:
        # 1. Decode JWT (Anonymous Session)
        payload = jwt.decode(
            actual_token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"]
        )

        if payload.get("role") != "customer":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid role for chat")

        tenant_id = payload.get("tenant_id")
        ticket_id = payload.get("ticket_id")

        if not tenant_id or not ticket_id:
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED, "Token missing required claims"
            )

        # 2. Configure DB Session with RLS
        async with SessionLocal() as session:
            await session.execute(
                text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
                {"tenant_id": tenant_id},
            )
            # Yield the session, tenant_id, AND ticket_id for the logic
            yield session, tenant_id, uuid.UUID(ticket_id)

    except (PyJWTError, ValueError) as e:
        logging.warning(f"Chat session token error: {e}")
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid or expired session"
        ) from e
