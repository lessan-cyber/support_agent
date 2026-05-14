"""Node for checking semantic cache before RAG pipeline."""

from langchain_core.messages import AIMessage
from redis.exceptions import RedisError

from app.agent.state import AgentState
from app.services.cache import semantic_cache
from app.services.embeddings import get_embedding_model
from app.settings import settings
from app.utils.logging_config import logger


async def check_cache(state: AgentState) -> dict:
    """
    Check semantic cache for similar queries before proceeding with RAG.

    Uses the rephrased (standalone) question set by the contextualize node,
    so follow-up questions like "tell me more" get properly matched.

    Args:
        state (AgentState): The current state of the agent.

    Returns:
        dict: Updated state with cache hit status and potentially cached response
    """
    logger.info("---NODE: CHECK CACHE---")

    try:
        rephrased_question = state.get("rephrased_question")
        if not rephrased_question:
            raise ValueError("No rephrased question found in agent state")

        tenant_id = state["tenant_id"]

        model = get_embedding_model()

        query_embedding = await model.aembed_query(rephrased_question)

        cached_response = await semantic_cache.get_cached_response(
            tenant_id=tenant_id,
            query_embedding=query_embedding,
            threshold=settings.CACHE_SIMILARITY_THRESHOLD,
        )

        if cached_response:
            logger.info("Cache hit - returning cached response")
            return {
                "is_cache_hit": True,
                "messages": [AIMessage(content=cached_response)],
                "query_embedding": query_embedding,
                "documents": [],
            }

        logger.info("Cache miss - proceeding with RAG pipeline")
        return {
            "is_cache_hit": False,
            "query_embedding": query_embedding,
        }

    except (RedisError, ValueError, RuntimeError, OSError) as e:
        logger.error(f"Cache check failed with specific error: {e}", exc_info=True)
        return {"is_cache_hit": False}

    except Exception as e:
        logger.error(f"Cache check failed with unexpected error: {e}", exc_info=True)
        return {"is_cache_hit": False}
