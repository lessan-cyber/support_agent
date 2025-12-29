import json
from typing import Any, AsyncGenerator, Optional

from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import Runnable
from langgraph.graph import END, START, StateGraph

from app.agent.nodes.cache_check import check_cache
from app.agent.nodes.cache_update import cache_high_confidence_response
from app.agent.nodes.confidence import grade_confidence
from app.agent.nodes.contextualize import contextualize_question
from app.agent.nodes.escalation import escalate_to_human
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
graph.add_node("grade_confidence", grade_confidence)
graph.add_node("cache_high_confidence", cache_high_confidence_response)
graph.add_node("escalate", escalate_to_human)

# Define the edges
graph.add_edge(START, "check_cache")

# Conditional edge: if cache hit, go directly to END (with cached response)
# If cache miss, proceed with contextualize -> retrieve -> generate
graph.add_conditional_edges(
    "check_cache",
    lambda state: END if state["is_cache_hit"] else "contextualize",
    {"END", "contextualize"},
)

graph.add_edge("contextualize", "retrieve")
graph.add_edge("retrieve", "generate")
graph.add_edge("generate", "grade_confidence")


# Conditional edge: based on confidence score, either cache+end or escalate
def should_escalate(state: AgentState) -> str:
    """Determine if the answer should be escalated based on confidence score."""
    confidence = state.get("confidence_score", 0.5)
    # Use threshold of 0.7 as specified in the PRD
    return "escalate" if confidence < 0.7 else "cache_high_confidence"


graph.add_conditional_edges(
    "grade_confidence",
    should_escalate,
    {"cache_high_confidence", "escalate"},
)

# After caching high-confidence responses, go to END
graph.add_edge("cache_high_confidence", END)

# Escalate node goes to END (graph interruption happens within the node)
graph.add_edge("escalate", END)

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
    Streams of response from the RAG agent with persistent state and interrupt handling.

    Args:
        message (str): The user's message.
        tenant_id (str): The ID of tenant.
        ticket_id (str): The ID of ticket, used as as thread_id.

    Yields:
        str: JSON-formatted strings representing events in the stream.
    """
    # Get's runnable graph via dependency injection
    runnable = get_runnable()

    # Configuration for the stream, specifying thread_id for persistence
    config = {"configurable": {"thread_id": ticket_id}}

    initial_state = {
        "messages": [HumanMessage(content=message)],
        "tenant_id": tenant_id,
        "ticket_id": ticket_id,
        "documents": [],
        "is_cache_hit": False,
        "rephrased_question": None,
        "query_embedding": None,
        "confidence_score": None,
        "escalated": False,
        "escalation_payload": None,
    }

    # Store generated response temporarily until confidence is confirmed
    pending_response = None

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

            # Capture generated response but DON'T stream it yet
            if kind == "on_chain_end" and event["name"] == "generate":
                output = event["data"].get("output")

                if output:
                    messages = output.get("messages", [])

                    if messages:
                        # Store the last AI message for streaming after confidence check
                        for msg in messages:
                            if isinstance(msg, AIMessage) and msg.content:
                                pending_response = msg.content
                                break

            # Stream cached response immediately (cache hits are trusted)
            if kind == "on_chain_end" and event["name"] == "check_cache":
                output = event["data"].get("output")

                if output and output.get("is_cache_hit"):
                    messages = output.get("messages", [])

                    if messages:
                        cached_content = messages[0].content

                        yield json.dumps({"type": "token", "content": cached_content})

            # Stream the AI response ONLY after confidence is confirmed good
            if kind == "on_chain_end" and event["name"] == "cache_high_confidence":
                if pending_response:
                    yield json.dumps({"type": "token", "content": pending_response})
                    pending_response = None

            # Handle Escalation: send generic message, NOT the AI response
            if kind == "on_chain_end" and event["name"] == "escalate":
                output = event["data"].get("output")

                if output and output.get("escalated"):
                    # Send escalation event with ticket ID
                    yield json.dumps(
                        {
                            "type": "escalation",
                            "ticket_id": ticket_id,
                            "content": "We cannot treat your request now. Your request is being processed and we will get back to you shortly.",
                        }
                    )

                    # Don't stream the pending AI response
                    pending_response = None

            # Handle interrupts - graph was paused waiting for human input
            if kind == "on_chain_end" and event["name"] == "__interrupt__":
                # Graph was interrupted - extract payload
                interrupt_data = event["data"].get("output", {}).get("__interrupt__")
                if interrupt_data and len(interrupt_data) > 0:
                    escalation_data = interrupt_data[0]
                    logger.info(f"Graph interrupted: {escalation_data}")

                    # Send escalation event to frontend with full payload
                    yield json.dumps(
                        {
                            "type": "escalation",
                            "ticket_id": escalation_data.get("ticket_id"),
                            "user_question": escalation_data.get("user_question"),
                            "bridge_message": escalation_data.get("bridge_message"),
                            "content": "We cannot treat your request now. Your request is being processed and we will get back to you shortly.",
                        }
                    )

                    # Don't stream the pending AI response
                    pending_response = None

                    # Send end event since graph is paused
                    yield json.dumps({"type": "end", "content": ""})
                    return  # Stop streaming

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
