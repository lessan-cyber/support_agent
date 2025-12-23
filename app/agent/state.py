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
