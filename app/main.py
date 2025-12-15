from contextlib import asynccontextmanager

from fastapi import FastAPI
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from app.agent import constructor as agent_constructor
from app.api.v1 import chat as chat_router
from app.api.v1 import documents as documents_router
from app.config.redis import check_redis_connection
from app.config.supabase import check_supabase_connection
from app.settings import settings
from app.utils.startup_events import initialize_vector_store

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handle application startup and shutdown events.
    """
    # Startup
    print("---APPLICATION STARTUP---")
    await check_redis_connection()
    await check_supabase_connection()
    await initialize_vector_store()

    checkpointer_db_url = str(settings.DATABASE_URL)
    if "+asyncpg" in checkpointer_db_url:
        checkpointer_db_url = checkpointer_db_url.replace("+asyncpg", "")
    checkpointer_db_url = f"{checkpointer_db_url}?sslmode=disable"

    async with AsyncPostgresSaver.from_conn_string(checkpointer_db_url) as checkpointer:
        # One-time setup for the checkpointer's table
        await checkpointer.setup()

        # Compile the agent graph with the checkpointer
        agent_constructor.runnable = agent_constructor.graph.compile(
            checkpointer=checkpointer
        )
        print("---LANGGRAPH CHECKPOINTER AND AGENT ARE READY---")

        yield

    # Shutdown
    print("---APPLICATION SHUTDOWN---")


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
