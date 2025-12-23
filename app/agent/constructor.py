import json
from typing import Any, AsyncGenerator, Optional

from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import Runnable
from langgraph.graph import END, START, StateGraph

from app.agent.nodes.cache_check import check_cache
from app.agent.nodes.contextualize import contextualize_question
from app.agent.nodes.generation import generate_response
from app.agent.nodes.retrieval import retrieve_documents
from app.agent.state import AgentState
from app.utils.logging_config import logger

# Define the graph structure
graph = StateGraph(AgentState)
graph.add_node("check_cache", check_cache)
graph.add_node("contextualize", contextualize_question)
graph.add_node("retrieve", retrieve_documents)
graph.add_node("generate", generate_response)

# Define the edges
graph.add_edge(START, "check_cache")

# Conditional edge: if cache hit, go directly to END (with cached response)
# If cache miss, proceed with contextualize -> retrieve -> generate
graph.add_conditional_edges(
    "check_cache",
    lambda state: END if state["is_cache_hit"] else "contextualize",
    {END, "contextualize"},
)

graph.add_edge("contextualize", "retrieve")
graph.add_edge("retrieve", "generate")
graph.add_edge("generate", END)

# `runnable` is now a placeholder, to be compiled in `main.py`'s lifespan.
# This will be set via dependency injection rather than global variable
_runnable: Optional[Runnable] = None


def get_runnable() -> Runnable:
    """Get the compiled runnable graph."""
    if _runnable is None:
        raise RuntimeError(
            "LangGraph has not been initialized. Ensure application startup is complete."
        )
    return _runnable


def set_runnable(runnable_graph: Runnable) -> None:
    """Set the compiled runnable graph."""
    global _runnable
    _runnable = runnable_graph


async def stream_response(
    message: str, tenant_id: str, ticket_id: str
) -> AsyncGenerator[str, None]:
    """
    Streams the response from the RAG agent with persistent state.

    Args:
        message (str): The user's message.
        tenant_id (str): The ID of the tenant.
        ticket_id (str): The ID of the ticket, used as the thread_id.

    Yields:
        str: JSON-formatted strings representing events in the stream.
    """
    # Get the runnable graph via dependency injection
    runnable = get_runnable()

    # Configuration for the stream, specifying the thread_id for persistence
    config = {"configurable": {"thread_id": ticket_id}}

    initial_state = {
        "messages": [HumanMessage(content=message)],
        "tenant_id": tenant_id,
        "ticket_id": ticket_id,
        "documents": [],
        "is_cache_hit": False,
        "rephrased_question": None,
        "query_embedding": None,
    }

    try:
        async for event in runnable.astream_events(
            initial_state, config=config, version="v2"
        ):
            kind = event["event"]

            if kind == "on_chain_start":
                # Only send retrieving status at the start of the graph

                if event["name"] == "LangGraph":
                    yield json.dumps(
                        {"type": "status", "content": "Retrieving documents..."}
                    )

            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]

                if isinstance(chunk, AIMessage) and chunk.content:
                    yield json.dumps({"type": "token", "content": chunk.content})

            # Handle Cache Hit: The check_cache node outputs a message, but doesn't stream it via LLM.

            # We intercept the node output.

            if kind == "on_chain_end" and event["name"] == "check_cache":
                output = event["data"].get("output")

                if output and output.get("is_cache_hit"):
                    # Cache hit! Extract the message and yield it as tokens.

                    messages = output.get("messages", [])

                    if messages:
                        cached_content = messages[0].content

                        yield json.dumps({"type": "token", "content": cached_content})

    except Exception as e:
        # Log the error and yield an error event
        logger.error(f"Agent streaming error: {e}", exc_info=True)
        yield json.dumps(
            {
                "type": "error",
                "content": "An error occurred while processing your request",
            }
        )
    finally:
        # Signal the end of the stream
        yield json.dumps({"type": "end", "content": ""})
