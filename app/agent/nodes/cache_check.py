"""Node for checking semantic cache before RAG pipeline."""

from typing import Optional

from langchain_core.messages import AIMessage

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
        # Get the user's original question
        user_question = state["messages"][-1].content
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
            
    except Exception as e:
        logger.error(f"Cache check failed: {e}", exc_info=True)
        
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