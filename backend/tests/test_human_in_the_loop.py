"""Test complete human-in-the-loop workflow with graph interruption and resumption."""

import asyncio
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.constructor import get_runnable, set_runnable
from app.agent.state import AgentState
from app.config.db import SessionLocal
from app.main import app
from app.models.message import Message, SenderType
from app.models.ticket import Ticket, TicketStatus
from app.services.cache import semantic_cache
from app.services.embeddings import get_embedding_model
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START


@pytest.fixture(scope="session")
async def setup_graph():
    """Setup the agent graph with in-memory checkpointer for testing."""
    from app.agent.constructor import graph

    checkpointer = MemorySaver()
    compiled_graph = graph.compile(checkpointer=checkpointer)
    set_runnable(compiled_graph)

    # Initialize semantic cache
    await semantic_cache.initialize()

    yield compiled_graph

    # Cleanup
    await semantic_cache.close()


@pytest.fixture
async def db_session():
    """Create a database session for testing."""
    async with SessionLocal() as session:
        yield session


async def test_escalation_interrupt(setup_graph, db_session: AsyncSession):
    """Test that escalation node properly interrupts graph execution."""
    logger.info("Testing escalation interrupt...")

    ticket_id = str(uuid.uuid4())
    tenant_id = str(uuid.uuid4())

    # Create a ticket
    ticket = Ticket(id=ticket_id, tenant_id=tenant_id)
    db_session.add(ticket)
    await db_session.commit()

    # Prepare initial state
    initial_state = {
        "messages": [
            {"role": "user", "content": "Test question that triggers escalation"}
        ],
        "tenant_id": tenant_id,
        "ticket_id": ticket_id,
        "documents": [],
        "is_cache_hit": False,
        "rephrased_question": None,
        "query_embedding": None,
        "confidence_score": 0.5,  # Low confidence to trigger escalation
        "escalated": False,
        "escalation_payload": None,
    }

    config = {"configurable": {"thread_id": ticket_id}}
    runnable = get_runnable()

    # Run graph - should hit interrupt
    result = await runnable.ainvoke(initial_state, config=config)

    # Check that graph was interrupted
    assert "__interrupt__" in result
    assert len(result["__interrupt__"]) > 0

    escalation_data = result["__interrupt__"][0]
    assert escalation_data["type"] == "escalation"
    assert escalation_data["ticket_id"] == ticket_id
    assert "user_question" in escalation_data

    # Check ticket status
    ticket_result = await db_session.execute(
        select(Ticket.status).where(Ticket.id == ticket_id)
    )
    current_status = ticket_result.scalar()
    assert current_status == TicketStatus.PENDING_HUMAN

    logger.info("Escalation interrupt test passed!")


async def test_graph_resumption(setup_graph, db_session: AsyncSession):
    """Test that graph can be resumed with human answer."""
    logger.info("Testing graph resumption...")

    ticket_id = str(uuid.uuid4())
    tenant_id = str(uuid.uuid4())
    human_answer = "This is the expert human-provided answer."

    # Create a ticket
    ticket = Ticket(
        id=ticket_id, tenant_id=tenant_id, status=TicketStatus.PENDING_HUMAN
    )
    db_session.add(ticket)
    await db_session.commit()

    # Prepare initial state
    initial_state = {
        "messages": [{"role": "user", "content": "Test question"}],
        "tenant_id": tenant_id,
        "ticket_id": ticket_id,
        "documents": [],
        "is_cache_hit": False,
        "rephrased_question": None,
        "query_embedding": None,
        "confidence_score": 0.5,
        "escalated": False,
        "escalation_payload": None,
    }

    config = {"configurable": {"thread_id": ticket_id}}
    runnable = get_runnable()
    from langgraph.types import Command

    # First run - should interrupt
    result = await runnable.ainvoke(initial_state, config=config)
    assert "__interrupt__" in result

    # Resume with human answer
    final_state = await runnable.ainvoke(Command(resume=human_answer), config=config)

    # Check that human answer was added
    messages = final_state["messages"]
    assert any(
        msg.content == human_answer for msg in messages if hasattr(msg, "content")
    )

    logger.info("Graph resumption test passed!")


async def test_idempotent_db_update(setup_graph, db_session: AsyncSession):
    """Test that escalation node doesn't update DB twice on resume."""
    logger.info("Testing idempotent DB update...")

    ticket_id = str(uuid.uuid4())
    tenant_id = str(uuid.uuid4())

    # Create a ticket
    ticket = Ticket(id=ticket_id, tenant_id=tenant_id)
    db_session.add(ticket)
    await db_session.commit()

    # Prepare initial state
    initial_state = {
        "messages": [{"role": "user", "content": "Test question"}],
        "tenant_id": tenant_id,
        "ticket_id": ticket_id,
        "documents": [],
        "is_cache_hit": False,
        "rephrased_question": None,
        "query_embedding": None,
        "confidence_score": 0.5,
        "escalated": False,
        "escalation_payload": None,
    }

    config = {"configurable": {"thread_id": ticket_id}}
    runnable = get_runnable()
    from langgraph.types import Command

    # First run - update status to PENDING_HUMAN
    await runnable.ainvoke(initial_state, config=config)

    ticket_result = await db_session.execute(
        select(Ticket.status).where(Ticket.id == ticket_id)
    )
    status_after_first_run = ticket_result.scalar()
    assert status_after_first_run == TicketStatus.PENDING_HUMAN

    # Resume - should NOT update status again
    final_state = await runnable.ainvoke(Command(resume="Human answer"), config=config)

    ticket_result = await db_session.execute(
        select(Ticket.status).where(Ticket.id == ticket_id)
    )
    status_after_resume = ticket_result.scalar()
    assert status_after_resume == TicketStatus.PENDING_HUMAN  # Should stay the same

    logger.info("Idempotent DB update test passed!")


async def test_human_answer_caching(setup_graph, db_session: AsyncSession):
    """Test that human-provided answers are cached correctly."""
    logger.info("Testing human answer caching...")

    ticket_id = str(uuid.uuid4())
    tenant_id = str(uuid.uuid4())
    human_answer = "Expert solution for caching test."
    user_question = "How do I solve this problem?"

    # Create a ticket
    ticket = Ticket(id=ticket_id, tenant_id=tenant_id)
    db_session.add(ticket)

    # Create user message
    user_message = Message(
        ticket_id=ticket_id,
        tenant_id=tenant_id,
        sender_type=SenderType.USER,
        content=user_question,
    )
    db_session.add(user_message)
    await db_session.commit()

    # Generate embedding for the question
    embedding_model = get_embedding_model()
    question_embedding = await embedding_model.aembed_query(user_question)

    # Cache the human answer
    await semantic_cache.cache_response(
        tenant_id=tenant_id,
        query_embedding=question_embedding,
        query_text=user_question,
        response=human_answer,
    )

    # Verify cache hit
    cached_response = await semantic_cache.get_cached_response(
        tenant_id=tenant_id, query_embedding=question_embedding, threshold=0.9
    )

    assert cached_response == human_answer

    logger.info("Human answer caching test passed!")


async def run_all_tests(setup_graph):
    """Run all tests."""
    from app.utils.logging_config import logger

    try:
        async with SessionLocal() as db_session:
            await test_escalation_interrupt(setup_graph, db_session)
            await test_graph_resumption(setup_graph, db_session)
            await test_idempotent_db_update(setup_graph, db_session)
            await test_human_answer_caching(setup_graph, db_session)

            logger.info("\n🎉 All human-in-the-loop tests passed!")
            return True
    except Exception as e:
        logger.error(f"\n❌ Test failed: {e}", exc_info=True)
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    from app.utils.logging_config import logger
    from app.agent.constructor import graph

    logger.info("Setting up graph...")
    checkpointer = MemorySaver()
    compiled_graph = graph.compile(checkpointer=checkpointer)
    set_runnable(compiled_graph)

    logger.info("Initializing semantic cache...")
    import asyncio

    asyncio.run(semantic_cache.initialize())

    logger.info("Running tests...")
    result = asyncio.run(run_all_tests(compiled_graph))

    asyncio.run(semantic_cache.close())
