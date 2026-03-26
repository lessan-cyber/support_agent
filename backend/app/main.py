from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.types import ASGIApp, Receive, Scope, Send

from app.agent import constructor as agent_constructor
from app.api.v1 import admin as admin_router
from app.api.v1 import chat as chat_router
from app.api.v1 import documents as documents_router
from app.config.redis import check_redis_connection
from app.config.supabase import check_supabase_connection
from app.services.cache import semantic_cache
from app.settings import settings
from app.utils.limiter import limiter
from app.utils.logging_config import logger
from app.utils.startup_events import convert_database_uri, initialize_vector_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handle application startup and shutdown events.
    """
    await check_redis_connection()
    await check_supabase_connection()

    try:
        await semantic_cache.initialize()
    except Exception as e:
        logger.warning(
            f"Semantic cache initialization failed, continuing without cache: {e}"
        )

    await initialize_vector_store()

    checkpoint_db_url = await convert_database_uri(settings.DATABASE_URL)
    async with AsyncPostgresSaver.from_conn_string(checkpoint_db_url) as checkpointer:
        await checkpointer.setup()
        compiled_graph = agent_constructor.graph.compile(checkpointer=checkpointer)
        agent_constructor.set_runnable(compiled_graph)
        logger.info("LANGGRAPH CHECKPOINTER AND AGENT ARE READY")

        yield

    try:
        await semantic_cache.close()
    except Exception as e:
        logger.warning(f"Error closing semantic cache: {e}")


app = FastAPI(
    lifespan=lifespan,
    title="Support Agent",
    description="A simple API for managing support tickets",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class ConditionalGZipMiddleware:
    def __init__(
        self,
        app: ASGIApp,
        minimum_size: int = 1000,
        compresslevel: int = 5,
    ) -> None:
        self.app = app
        self.minimum_size = minimum_size
        self.compresslevel = compresslevel
        self.gzip_middleware = GZipMiddleware(
            app=app, minimum_size=minimum_size, compresslevel=compresslevel
        )

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        should_skip_compression = scope.get("path") == "/api/v1/chat/stream"
        if not should_skip_compression:
            # Use the gzip middleware for non-SSE responses
            await self.gzip_middleware(scope, receive, send)
        else:
            # Bypass compression for SSE responses
            await self.app(scope, receive, send)


# Add conditional Gzip compression middleware
app.add_middleware(ConditionalGZipMiddleware, minimum_size=1000, compresslevel=5)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# Include routers
app.include_router(admin_router.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(
    documents_router.router, prefix="/api/v1/documents", tags=["Documents"]
)
app.include_router(chat_router.router, prefix="/api/v1/chat", tags=["Chat"])


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Hello from the Support Agent API!"}
