from collections.abc import Sequence
from typing import Annotated, TypedDict

from langchain_core.documents import Document
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """The state of the agent."""

    messages: Annotated[Sequence[BaseMessage], add_messages]
    tenant_id: str
    ticket_id: str
    rephrased_question: str | None
    query_embedding: list[float] | None
    documents: list[Document]
    is_cache_hit: bool
    confidence_score: float | None
    escalated: bool | None
    escalation_payload: dict | None


STANDARD_BRIDGE = (
    "I need to check this with an expert. "
    "Ticket #{ticket_id} has been created. "
    "{suffix}"
)


def build_escalation(
    ticket_id: str,
    user_question: str,
    content_suffix: str = "You will receive an email notification when we have an answer.",
    context: list[str] | None = None,
) -> dict:
    """Build a standardised escalation payload."""
    bridge_message = (
        f"I need to check this with an expert. "
        f"Ticket #{ticket_id} has been created. "
        f"{content_suffix}"
    )
    payload: dict = {
        "type": "escalation",
        "ticket_id": ticket_id,
        "user_question": user_question,
        "bridge_message": bridge_message,
        "content": bridge_message,
    }
    if context:
        payload["context"] = context
    return payload
