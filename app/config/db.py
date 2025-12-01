import uuid
from typing import AsyncGenerator, Generator

from fastapi import Depends, HTTPException, Request
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from app.settings import settings as s
from app.utils import logger

engine = create_async_engine(
    str(s.DATABASE_URL),
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=20,
    max_overflow=20,
    echo=s.DEBUG,
)

# Synchronous Engine for Celery tasks
sync_engine = create_engine(
    str(s.DATABASE_URL).replace("postgresql+asyncpg", "postgresql+psycopg2"),
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=20,
    max_overflow=20,
    echo=s.DEBUG,
)


SessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, autocommit=False, autoflush=False
)

SessionLocalSync: sessionmaker[Session] = sessionmaker(
    autocommit=False, autoflush=False, bind=sync_engine
)


def get_tenant_id(request: Request) -> str:
    """
    Dependency to extract tenant_id from request.state.

    This assumes that the RLS middleware has already run and populated
    `request.state.tenant_id`.
    """
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        # This should not happen if the middleware is configured correctly
        raise HTTPException(
            status_code=500, detail="Tenant ID not found in request state."
        )

    try:
        uuid.UUID(tenant_id)  # Validate the tenant_id is a valid UUID
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID")

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
        except SQLAlchemyError:
            await session.rollback()
            raise


def get_db_sync(tenant_id: str) -> Generator[Session, None, None]:
    """
    Synchronous dependency to get a DB session with RLS tenant context set.
    For use in Celery tasks or other synchronous contexts.
    """
    db = SessionLocalSync()
    try:
        # Enforce RLS by setting the session-local 'app.current_tenant' variable.
        db.execute(
            text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
            {"tenant_id": tenant_id},
        )
        yield db
    except SQLAlchemyError:
        db.rollback()
        raise
    finally:
        db.close()


async def check_db_connection():
    try:
        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))
            logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise
