import asyncio
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.settings import settings as s

engine = create_async_engine(
    str(s.DATABASE_URL),
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=20,
    max_overflow=20,
    echo=s.DEBUG,
)


SessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)


async def get_tenant_id(request: Request) -> str:
    """
    Dependency to extract tenant_id from request.state.

    This assumes that the RLS middleware has already run and populated
    `request.state.tenant_id`.
    """
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        # This should not happen if the middleware is configured correctly
        raise HTTPException(status_code=500, detail="Tenant ID not found in request state.")
    return tenant_id


async def get_db(
    tenant_id: str = Depends(get_tenant_id),
) -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency to get a DB session with RLS tenant context set.
    """
    async with SessionLocal() as session:
        try:
            # Enforce RLS by setting the session-local 'app.current_tenant' variable.
            # Using set_config with 'is_local=true' means it only lasts for the current session.
            await session.execute(
                text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
                {"tenant_id": tenant_id},
            )
            yield session
        except Exception:
            await session.rollback()
            raise



async def check_db_connection():
    try:
        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))
            print("Database connection successful")
    except Exception as e:
        print(f"Database connection error: {e}")
        raise
