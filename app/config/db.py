import asyncio
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.settings import settings as s

engine = create_async_engine(
    str(s.DATABASE_URL),
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=20,
    max_overflow=20,
    echo=True,
)

Base = declarative_base()

SessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)

# async def init_db():
#    """
#    creation des tables
#    """
#    async with engine.begin() as conn:
#        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()


async def check_db_connection():
    try:
        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))
            print("Database connection successful")
    except Exception as e:
        print(f"Database connection error: {e}")
        raise
