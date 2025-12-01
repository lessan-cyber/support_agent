"""Dependencies for API endpoints."""
import uuid
from typing import AsyncGenerator

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.db import SessionLocal
from app.models.user import User
from app.settings import settings

reusable_oauth2 = HTTPBearer(scheme_name="Bearer")


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency to get a DB session.
    """
    async with SessionLocal() as session:
        yield session


async def get_current_user(
    request: Request,
    token: str = Depends(reusable_oauth2),
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
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}"
        )

    user = await db.get(User, uuid.UUID(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
        )

    # Set the RLS context for the current tenant
    await db.execute(
        text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
        {"tenant_id": str(user.tenant_id)},
    )
    # Attach the session to the request state so it can be accessed by other dependencies
    request.state.db = db
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
