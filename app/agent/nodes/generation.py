"Node for generating a response based on retrieved documents."

from langchain_core.messages import AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from app.agent.state import AgentState
from app.settings import settings

# 1. Initialize the LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7,
    google_api_key=settings.GOOGLE_API_KEY,
)

# 2. Create a prompt template
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful customer support assistant for our company. "
            "Use the following retrieved context to answer the user's question. "
            "If you don't know the answer, just say that you don't know. "
            "Keep the answer concise and professional.\n\n"
            "CONTEXT:\n{context}",
        ),
        ("human", "{question}"),
    ]
)


async def generate_response(state: AgentState) -> dict:
    """
    Generate an answer to the user's question based on the retrieved documents.

    Args:
        state (AgentState): The current state of the agent.

    Returns:
        dict: A dictionary containing the AIMessage to be added to the state.
    """
    print("---NODE: GENERATE RESPONSE---")
    user_question = state["messages"][-1].content
    documents = state["documents"]

    # Format the documents into a string for the prompt context
    context_str = "\n\n---\n\n".join(
        [f"Content: {doc.page_content}\nMetadata: {doc.metadata}" for doc in documents]
    )

    # Create the chain and invoke it
    chain = prompt | llm
    response = await chain.ainvoke({"context": context_str, "question": user_question})

    print(f"---LLM RESPONSE: {response.content}---")

    return {"messages": [AIMessage(content=response.content)]}
