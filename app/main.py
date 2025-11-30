from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1 import documents as documents_router
from app.config.db import check_db_connection
from app.config.redis import check_redis_connection
from app.config.supabase import check_supabase_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    await check_db_connection()
    await check_redis_connection()
    await check_supabase_connection()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Support Agent",
    description="A simple API for managing support tickets",
)

# Include routers
app.include_router(
    documents_router.router, prefix="/api/v1/documents", tags=["Documents"]
)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Hello from Support Agent API!"}
