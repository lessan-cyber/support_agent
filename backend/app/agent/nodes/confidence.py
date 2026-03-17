"""Node for grading the confidence of generated answers."""

import json
import re

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from app.agent.state import AgentState
from app.settings import settings
from app.utils.logging_config import logger

# 1. Initialize the LLM for confidence grading
confidence_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0,
    google_api_key=settings.GOOGLE_API_KEY,
)

# 2. Create a prompt for confidence assessment
confidence_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert evaluator of customer support responses. "
            "Analyze the following AI-generated answer and rate its confidence on a scale of 0.0 to 1.0. "
            "Important: If the answer admits inability, contains phrases like 'I cannot', 'I'm unable', "
            "'I don't know', or similar, the confidence score MUST be 0.3 or lower. "
            "\n\n"
            "Consider factors like:"
            "- Does the answer directly address the user's question? (If not, score <= 0.3)"
            "- Is the answer based on relevant context and documents? (If not, score <= 0.4)"
            "- Does the answer contain hedging language or admit inability? (If yes, score <= 0.3)"
            "- Would this answer likely satisfy a customer without needing human intervention?"
            "- Does the answer provide specific, actionable information?"
            "\n\n"
            "Be strict: Only give scores above 0.7 for answers that are:"
            "- Directly responsive to the question"
            "- Based on provided context/documents"
            "- Specific and actionable"
            "- Free of hedging or uncertainty"
            "\n\n"
            "Return ONLY a JSON object with a single key 'confidence_score' containing a float between 0.0 and 1.0."
            "Do NOT provide any additional text or explanation.",
        ),
        (
            "human",
            "User Question: {question}\n\nContext: {context}\n\nAI Answer: {answer}",
        ),
    ]
)

# 3. Create the chain
confidence_chain = confidence_prompt | confidence_llm


def _extract_confidence_score(text: str) -> float:
    """Helper function to extract confidence score from LLM response."""
    try:
        # Try to parse as JSON first
        response_json = json.loads(text)
        return float(response_json.get("confidence_score", 0.5))
    except (json.JSONDecodeError, ValueError):
        # Fallback: try to extract number from text
        match = re.search(r"\d+\.?\d*", text)
        return float(match.group()) if match else 0.5


async def grade_confidence(state: AgentState) -> dict:
    """
    Grade the confidence of the generated answer.

    Args:
        state (AgentState): The current state of the agent.

    Returns:
        dict: Updated state with confidence score.
    """
    logger.info("---NODE: GRADE CONFIDENCE---")

    try:
        # Extract necessary information from state
        user_question = state["messages"][-1].content

        # Find the AI's answer - it should be the last AI message
        ai_answer = ""
        for msg in reversed(state["messages"]):
            if hasattr(msg, "type") and msg.type == "ai":
                ai_answer = msg.content
                break

        # If no AI message found, use the last message (this shouldn't happen in normal flow)
        if not ai_answer:
            ai_answer = state["messages"][-1].content

        # Format documents context for the prompt
        documents = state.get("documents", [])
        context_str = "\n\n---\n\n".join(
            [f"Content: {doc.page_content}" for doc in documents]
        )

        # Generate confidence assessment
        response = await confidence_chain.ainvoke(
            {"question": user_question, "context": context_str, "answer": ai_answer}
        )

        # Extract confidence score from response
        confidence_score = _extract_confidence_score(response.content)

        # Clamp the score between 0.0 and 1.0
        confidence_score = max(0.0, min(1.0, confidence_score))

        logger.info(f"Confidence score: {confidence_score:.2f}")

        return {"confidence_score": confidence_score}

    except Exception as e:
        logger.error(f"Error in grade_confidence: {e}", exc_info=True)
        # Default to medium confidence if evaluation fails
        return {"confidence_score": 0.5}
