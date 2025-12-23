from typing import Optional

from langchain_postgres import PGVectorStore
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from pydantic import PostgresDsn

from app.agent import constructor as agent_constructor
from app.agent.nodes import retrieval
from app.services.cache import semantic_cache
from app.services.embeddings import get_embedding_model
from app.settings import settings
from app.utils.logging_config import logger

checkpointer: Optional[AsyncPostgresSaver] = None


async def initialize_vector_store():
    """
    Initializes the PGVectorStore and patches it into the retrieval module.
    """
    try:
        store = await PGVectorStore.create(
            engine=retrieval.pg_engine,
            table_name="documents",
            embedding_service=get_embedding_model(),
            id_column="id",
            content_column="content",
            embedding_column="embedding",
            metadata_columns=["tenant_id", "file_id"],
            metadata_json_column="additional_data",
        )
        retrieval.vector_store = store
        logger.info("VECTOR STORE INITIALIZED")
    except Exception as e:
        logger.error(f"Failed to initialize vector store: {e}", exc_info=True)
        raise


async def convert_database_uri(uri: PostgresDsn) -> str:
    if "+asyncpg" in str(uri):
        new_uri = str(uri).replace("+asyncpg", "")
    new_uri = f"{new_uri}?sslmode=disable"
    return new_uri
