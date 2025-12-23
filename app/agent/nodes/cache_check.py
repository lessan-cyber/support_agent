"""Node for checking semantic cache before RAG pipeline."""

from typing import Optional

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
    
    Args:
        state (AgentState): The current state of the agent.
    
    Returns:
        dict: Updated state with cache hit status and potentially cached response
    """
    logger.info("---NODE: CHECK CACHE---")
    
    try:
        # Validate that messages exist and are not empty
        messages = state.get("messages")
        if not messages or not isinstance(messages, list) or len(messages) == 0:
            raise ValueError("No messages found in agent state")

        # Get the user's original question
        user_question = messages[-1].content
        tenant_id = state["tenant_id"]
        
        # Get singleton embedding model
        model = get_embedding_model()
        
        # Generate embedding for the query
        query_embedding = await model.aembed_query(user_question)
        
        # Check cache with tenant isolation
        cached_response = await semantic_cache.get_cached_response(
            tenant_id=tenant_id,
            query_embedding=query_embedding,
            threshold=settings.CACHE_SIMILARITY_THRESHOLD
        )
        
        if cached_response:
            # Cache hit - return the cached response immediately
            logger.info("Cache hit - returning cached response")
            return {
                "is_cache_hit": True,
                "messages": [AIMessage(content=cached_response)],
                "rephrased_question": user_question,  # Keep original for consistency
                "query_embedding": query_embedding,
                "documents": []  # No documents needed for cache hits
            }
        else:
            # Cache miss - proceed with RAG pipeline
            logger.info("Cache miss - proceeding with RAG pipeline")
            return {
                "is_cache_hit": False,
                "rephrased_question": user_question,  # Initialize with original question
                "query_embedding": query_embedding
            }
            
    except (RedisError, ValueError, RuntimeError, OSError) as e:
        logger.error(f"Cache check failed with specific error: {e}", exc_info=True)
        return _handle_fallback(state)
        
    except Exception as e:
        logger.error(f"Cache check failed with unexpected error: {e}", exc_info=True)
        return _handle_fallback(state)

def _handle_fallback(state: AgentState) -> dict:
    """Helper to handle fallback when cache check fails."""
    # Safely extract user question from state
    user_question = ""
    if isinstance(state, dict) and state.get("messages"):
        last_msg = state["messages"][-1]
        user_question = getattr(last_msg, "content", "")
        
    if not user_question:
        logger.debug("Falling back to empty string for rephrased_question")

    # Fallback: proceed with RAG pipeline if cache fails
    return {
        "is_cache_hit": False,
        "rephrased_question": user_question
    }