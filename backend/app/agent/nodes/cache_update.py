"""Node for caching high-confidence responses after successful generation."""

from redis.exceptions import RedisError

from app.agent.state import AgentState
from app.services.cache import semantic_cache
from app.utils.logging_config import logger


async def cache_high_confidence_response(state: AgentState) -> dict:
    """
    Cache responses that have high confidence scores.
    
    This node only runs for responses that passed the confidence threshold,
    ensuring we only cache high-quality answers.
    
    Args:
        state (AgentState): The current state of the agent.
        
    Returns:
        dict: Updated state (no changes needed)
    """
    logger.info("---NODE: CACHE HIGH CONFIDENCE RESPONSE---")
    
    try:
        tenant_id = state["tenant_id"]
        query_embedding = state.get("query_embedding")
        user_question = state["messages"][-1].content
        confidence_score = state.get("confidence_score", 0.5)
        
        # Find the AI's answer - it should be the last AI message
        ai_answer = ""
        for msg in reversed(state["messages"]):
            if hasattr(msg, 'type') and msg.type == 'ai':
                ai_answer = msg.content
                break
        
        # Only cache if we have all required data and this wasn't already a cache hit
        if (query_embedding and ai_answer and 
            not state.get("is_cache_hit", False) and 
            confidence_score >= 0.7):  # Only cache high-confidence answers
            
            await semantic_cache.cache_response(
                tenant_id=tenant_id,
                query_embedding=query_embedding,
                query_text=user_question,
                response=ai_answer
            )
            logger.info(f"Cached high-confidence response (score: {confidence_score:.2f}) for future use")
        else:
            logger.info(f"Skipping cache for response with confidence: {confidence_score:.2f}")
            
    except RedisError as e:
        logger.error(f"Failed to cache high-confidence response: {e}", exc_info=True)
        # Don't fail the main flow if caching fails
    except Exception as e:
        logger.error(f"Unexpected error in cache_high_confidence_response: {e}", exc_info=True)
    
    # Return empty dict as we don't modify state
    return {}