"""Node for handling escalation to human agents."""

from langchain_core.messages import AIMessage
from langgraph.errors import GraphInterrupt
from langgraph.types import interrupt

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.state import AgentState
from app.config.db import SessionLocal
from app.models.ticket import Ticket, TicketStatus
from app.utils.logging_config import logger


async def escalate_to_human(state: AgentState) -> dict:
    """
    Escalate ticket to a human agent when AI confidence is low.

    This node:
    1. Updates ticket status to PENDING_HUMAN (idempotent)
    2. Generates a bridge message for the user
    3. Interrupts graph execution and waits for human input
    4. On resume, adds the human-provided answer to the conversation

    Args:
        state (AgentState): The current state of the agent.

    Returns:
        dict: Updated state with human answer (after resume).
    """
    logger.info("---NODE: ESCALATE TO HUMAN---")

    try:
        ticket_id = state["ticket_id"]
        tenant_id = state["tenant_id"]
        user_question = state["messages"][-1].content
        documents = state.get("documents", [])

        async with SessionLocal() as session:
            # Set RLS context for this tenant
            await session.execute(
                text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
                {"tenant_id": str(tenant_id)},
            )

            # Check if already escalated to avoid duplicate updates on resume
            ticket_result = await session.execute(
                select(Ticket.status).where(Ticket.id == ticket_id)
            )
            current_status = ticket_result.scalar()

            if current_status != TicketStatus.PENDING_HUMAN:
                # Only update if not already escalated
                stmt = (
                    update(Ticket)
                    .where(Ticket.id == ticket_id)
                    .values(status=TicketStatus.PENDING_HUMAN)
                )
                await session.execute(stmt)
                await session.commit()
                logger.info(f"Ticket {ticket_id} escalated to PENDING_HUMAN status")
            else:
                logger.info(f"Ticket {ticket_id} already escalated, skipping update")

        # Generate bridge message for the user
        bridge_message = (
            "I need to check this with an expert. "
            f"Ticket #{ticket_id} has been created. "
            "You will receive an email notification when we have an answer."
        )

        logger.info(f"Generated bridge message: {bridge_message}")

        # Prepare escalation payload for frontend
        escalation_payload = {
            "type": "escalation",
            "ticket_id": ticket_id,
            "user_question": user_question,
            "bridge_message": bridge_message,
            "context": [doc.page_content for doc in documents],
        }

        # INTERRUPT - pause graph and wait for human input
        # This will be surfaced to caller in result["__interrupt__"]
        # When resumed, human_answer contains the admin's response
        human_answer = interrupt(escalation_payload)

        logger.info(
            f"Graph resumed with human answer: {human_answer[:100] if human_answer else 'None'}..."
        )

        # On resume, add human answer as an AI message to the conversation
        return {
            "messages": [AIMessage(content=human_answer)],
            "escalated": True,
        }

    except GraphInterrupt:
        # Re-raise the interrupt - this is expected behavior, not an error
        raise

    except Exception as e:
        logger.error(f"Error in escalate_to_human: {e}", exc_info=True)
        # Fallback: return a generic error message
        return {
            "messages": [
                AIMessage(
                    content="I'm having trouble processing your request. A support agent will contact you shortly."
                )
            ],
            "escalated": True,
        }
