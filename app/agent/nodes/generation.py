"""Node for generating a response based on retrieved documents."""

from langchain_core.messages import AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from redis.exceptions import RedisError

from app.agent.state import AgentState
from app.services.cache import semantic_cache
from app.settings import settings
from app.utils.logging_config import logger

# 1. Initialize the LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7,
    google_api_key=settings.GOOGLE_API_KEY,
)

# 2. Create a prompt template
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful customer support assistant for our company. "
            "Use the following retrieved context to answer the user's question. "
            "If you don't know the answer, just say that you don't know. "
            "Keep the answer concise and professional.\n\n"
            "CONTEXT:\n{context}",
        ),
        ("human", "{question}"),
    ]
)


async def generate_response(state: AgentState) -> dict:
    """
    Generate an answer to the user's question based on the retrieved documents.
    If this is not a cache hit, also cache the successful response.

    Args:
        state (AgentState): The current state of the agent.

    Returns:
        dict: A dictionary containing the AIMessage to be added to the state.
    """
    logger.info("---NODE: GENERATE RESPONSE---")
    user_question = state["messages"][-1].content
    # Use rephrased question for generation context if available
    generation_question = state.get("rephrased_question") or user_question
    
    documents = state["documents"]
    tenant_id = state["tenant_id"]
    is_cache_hit = state.get("is_cache_hit", False)
    query_embedding = state.get("query_embedding")

    # Format the documents into a string for the prompt context
    context_str = "\n\n---\n\n".join(
        [f"Content: {doc.page_content}\nMetadata: {doc.metadata}" for doc in documents]
    )

    # Create the chain and invoke it
    chain = prompt | llm
    response = await chain.ainvoke({"context": context_str, "question": generation_question})
    
    response_content = response.content
    result = {"messages": [AIMessage(content=response_content)]}
    
    # Only cache responses that were not cache hits (avoid duplicate caching)
    if not is_cache_hit and query_embedding:
        try:
            # Cache the successful response using the embedding from state
            await semantic_cache.cache_response(
                tenant_id=tenant_id,
                query_embedding=query_embedding,
                query_text=user_question,
                response=response_content
            )
            logger.info("Successfully cached response for future use")
        except RedisError as e:
            logger.error(f"Failed to cache response: {e}", exc_info=True)
            # Don't fail the main flow if caching fails
    
    return result
