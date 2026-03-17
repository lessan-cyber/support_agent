import json
from typing import AsyncGenerator, Optional

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
    Streams response from the RAG agent with state persistence and interrupt handling.

    Args:
        message: The user's message.
        tenant_id: The ID of the tenant.
        ticket_id: The ID of the ticket, used as the thread_id.

    Yields:
        JSON-formatted strings representing events in the stream.
    """
    runnable = get_runnable()
    config = {"configurable": {"thread_id": ticket_id}}

    initial_state = {
        "messages": [HumanMessage(content=message)],
        "tenant_id": tenant_id,
        "ticket_id": ticket_id,
    }

    pending_response = ""
    escalation_info = None

    try:
        async for event in runnable.astream_events(
            initial_state, config=config, version="v2"
        ):
            kind = event["event"]
            name = event.get("name")

            if kind == "on_chain_start":
                if name == "check_cache":
                    yield json.dumps(
                        {
                            "type": "status",
                            "content": "Checking for similar past answers...",
                        }
                    )
                elif name == "retrieve":
                    yield json.dumps(
                        {"type": "status", "content": "Searching knowledge base..."}
                    )
                elif name == "generate":
                    yield json.dumps(
                        {"type": "status", "content": "Generating response..."}
                    )
                elif name == "grade_confidence":
                    yield json.dumps(
                        {"type": "status", "content": "Verifying answer quality..."}
                    )

            elif kind == "on_chain_end":
                output = event["data"].get("output")
                if not output:
                    continue

                if name == "check_cache" and output.get("is_cache_hit"):
                    messages = output.get("messages", [])
                    if messages:
                        cached_content = messages[0].content
                        for i in range(0, len(cached_content), 3):
                            yield json.dumps(
                                {"type": "token", "content": cached_content[i : i + 3]}
                            )

                        return  # End stream after cache hit

                elif name == "generate":
                    messages = output.get("messages", [])
                    if messages and isinstance(messages[0], AIMessage):
                        pending_response = messages[0].content

                elif name == "grade_confidence":
                    confidence = output.get("confidence_score", 0.0)
                    if confidence >= 0.7 and pending_response:
                        for i in range(0, len(pending_response), 3):
                            yield json.dumps(
                                {
                                    "type": "token",
                                    "content": pending_response[i : i + 3],
                                }
                            )

                    elif confidence < 0.7:
                        escalation_info = {
                            "type": "escalation",
                            "ticket_id": ticket_id,
                            "content": "I am not confident in my answer. Escalating to a human agent.",
                        }
                        # Don't yield yet, wait for interrupt to confirm

    except GraphInterrupt:
        logger.info(f"Graph interrupted for ticket {ticket_id}, sending escalation.")
        if escalation_info:
            yield json.dumps(escalation_info)
        else:
            # Fallback escalation message
            yield json.dumps(
                {
                    "type": "escalation",
                    "ticket_id": ticket_id,
                    "content": "I need to check this with an expert. Your request is being processed.",
                }
            )

    except Exception as e:
        logger.error(
            f"Agent streaming error for ticket {ticket_id}: {e}", exc_info=True
        )
        yield json.dumps(
            {
                "type": "error",
                "content": "An error occurred while processing your request.",
            }
        )

    finally:
        yield json.dumps({"type": "end", "content": ""})
