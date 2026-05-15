"""Node for checking semantic cache with the raw user question before contextualization."""

from langchain_core.messages import AIMessage
from redis.exceptions import RedisError

from app.agent.state import AgentState
from app.services.cache import semantic_cache
from app.services.embeddings import get_embedding_model
from app.settings import settings
from app.utils.logging_config import logger


async def check_cache_raw(state: AgentState) -> dict:
    """
    Check semantic cache using the raw user question.

    This runs BEFORE contextualization. If the raw question matches a cached
    answer, we skip the LLM entirely (0 Gemini calls).  If it misses, the
    contextualize node will rephrase the question and check_cache will run
    a second time with the standalone version.

    Args:
        state (AgentState): The current state of the agent.

    Returns:
        dict: Updated state with cache hit status and potentially cached response.
    """
    logger.info("---NODE: CHECK CACHE (RAW)---")

    try:
        messages = state.get("messages")
        if not messages:
            raise ValueError("No messages found in agent state")

        raw_question = messages[-1].content
        tenant_id = state["tenant_id"]

        model = get_embedding_model()
        query_embedding = await model.aembed_query(raw_question)

        cached_response = await semantic_cache.get_cached_response(
            tenant_id=tenant_id,
            query_embedding=query_embedding,
            threshold=settings.CACHE_SIMILARITY_THRESHOLD,
        )

        if cached_response:
            logger.info("Raw cache hit - returning cached response")
            return {
                "is_cache_hit": True,
                "messages": [AIMessage(content=cached_response)],
                "rephrased_question": raw_question,
                "query_embedding": query_embedding,
                "documents": [],
            }

        logger.info("Raw cache miss - proceeding to contextualize")
        return {
            "is_cache_hit": False,
            "query_embedding": query_embedding,
            "rephrased_question": raw_question,
        }

    except (RedisError, ValueError, RuntimeError, OSError) as e:
        logger.error(f"Raw cache check failed: {e}", exc_info=True)
        return {"is_cache_hit": False}

    except Exception as e:
        logger.error(f"Raw cache check failed unexpectedly: {e}", exc_info=True)
        return {"is_cache_hit": False}
