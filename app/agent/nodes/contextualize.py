"""
Node for rephrasing the user's question based on chat history.
"""

# from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from app.agent.state import AgentState
from app.settings import settings
from app.utils.logging_config import logger

# 1. Create a lightweight LLM for the rephrasing task
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0,
    google_api_key=settings.GOOGLE_API_KEY,
)

# 2. Create a prompt that instructs the LLM to rephrase the question
# based on the chat history.
rephrase_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Given a chat history and the latest user question "
            "which might reference context in the chat history, "
            "formulate a standalone question which can be understood "
            "without the chat history. Do NOT answer the question, "
            "just reformulate it if needed and otherwise return it as is.",
        ),
        ("placeholder", "{chat_history}"),
        ("human", "{question}"),
    ]
)

# 3. Create the chain
rephrase_chain = rephrase_prompt | llm


async def contextualize_question(state: AgentState) -> dict:
    """
    Rephrase the user's question to make it standalone.

    Args:
        state (AgentState): The current state of the agent.

    Returns:
        dict: A dictionary with the rephrased question.
    """
    logger.info("---NODE: CONTEXTUALIZE QUESTION---")
    user_question = state["messages"][-1].content

    try:
        if len(state["messages"]) > 1:
            # Get all messages except the last one (current user message)
            # Use the configured max chat history length
            chat_history_messages = state["messages"][:-1][-settings.MAX_CHAT_HISTORY :]
            response = await rephrase_chain.ainvoke(
                {"chat_history": chat_history_messages, "question": user_question}
            )
            rephrased = response.content
            logger.info(f"Rephrased question: {rephrased}")
            return {"rephrased_question": rephrased}
        else:
            return {"rephrased_question": user_question}
    except (ValueError, RuntimeError) as e:
        # Add specific LangChain/Google API exceptions as needed
        logger.error(f"Error in contextualize_question: {e}", exc_info=True)
        return {"rephrased_question": user_question}
