from contextlib import asynccontextmanager

from fastapi import FastAPI
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from app.agent import constructor as agent_constructor
from app.api.v1 import chat as chat_router
from app.api.v1 import documents as documents_router
from app.config.redis import check_redis_connection
from app.config.supabase import check_supabase_connection
from app.services.cache import semantic_cache
from app.settings import settings
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

# Include routers
app.include_router(
    documents_router.router, prefix="/api/v1/documents", tags=["Documents"]
)
app.include_router(chat_router.router, prefix="/api/v1/chat", tags=["Chat"])


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Hello from Support Agent API!"}
