from typing import Optional

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langchain_postgres import PGVectorStore

from app.agent import constructor as agent_constructor
from app.agent.nodes import retrieval
from app.settings import settings

checkpointer: Optional[AsyncPostgresSaver] = None


async def initialize_vector_store():
    """
    Initializes the PGVectorStore and patches it into the retrieval module.
    """
    print("---INITIALIZING VECTOR STORE---")
    store = await PGVectorStore.create(
        engine=retrieval.pg_engine,
        table_name="documents",
        embedding_service=retrieval.embedding_model,
        id_column="id",
        content_column="content",
        embedding_column="embedding",
        metadata_columns=["tenant_id", "file_id"],
        metadata_json_column="additional_data",
    )
    retrieval.vector_store = store
    print("---VECTOR STORE INITIALIZED---")


async def setup_langgraph_checkpointer():
    """
    Sets up the LangGraph checkpointer and compiles the agent graph.
    """
    global checkpointer
    print("---SETTING UP LANGGRAPH CHECKPOINTER---")

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
