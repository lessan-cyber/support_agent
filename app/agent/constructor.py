import json
from typing import Any, AsyncGenerator, Optional

from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import END, START, StateGraph

from app.agent.nodes.generation import generate_response
from app.agent.nodes.retrieval import retrieve_documents
from app.agent.state import AgentState
from app.config.db import engine

# Define the graph structure
graph = StateGraph(AgentState)
graph.add_node("retrieve", retrieve_documents)
graph.add_node("generate", generate_response)

# Define the edges
graph.add_edge(START, "retrieve")
graph.add_edge("retrieve", "generate")
graph.add_edge("generate", END)

# `runnable` is now a placeholder, to be compiled in `main.py`'s lifespan.
runnable: Optional[Any] = None


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
    # Ensure the graph has been compiled during application startup.
    if runnable is None:
        raise RuntimeError("LangGraph has not been initialized. Ensure application startup is complete.")

    # Configuration for the stream, specifying the thread_id for persistence
    config = {"configurable": {"thread_id": ticket_id}}

    initial_state = {
        "messages": [HumanMessage(content=message)],
        "tenant_id": tenant_id,
        "ticket_id": ticket_id,
        "documents": [],
    }

    async for event in runnable.astream_events(
        initial_state, config=config, version="v1"
    ):
        kind = event["event"]

        if kind == "on_chain_start":
            yield json.dumps({"type": "status", "content": "Retrieving documents..."})

        if kind == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            if isinstance(chunk, AIMessage) and chunk.content:
                yield json.dumps({"type": "token", "content": chunk.content})

    # Signal the end of the stream
    yield json.dumps({"type": "end", "content": ""})
