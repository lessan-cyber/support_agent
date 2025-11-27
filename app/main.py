from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware

from app.config.db import check_db_connection
from app.middleware.rls import rls_tenant_middleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    await check_db_connection()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Support Agent",
    description="A simple API for managing support tickets",
)

# Add the RLS middleware
app.add_middleware(BaseHTTPMiddleware, dispatch=rls_tenant_middleware)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Hello from Support Agent API!"}
