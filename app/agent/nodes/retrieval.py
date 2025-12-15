"""Node for retrieving relevant documents from the vector store."""
from typing import Optional

from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_core.embeddings import Embeddings
from langchain_postgres import PGEngine, PGVectorStore

from app.agent.state import AgentState
from app.settings import settings

# 1. Initialize the embedding model and engine, which will be used at startup.
embedding_model: Embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
pg_engine = PGEngine.from_connection_string(url=str(settings.DATABASE_URL))

# 2. A placeholder for the vector store, to be initialized at application startup.
# This avoids re-creating the store on every request.
vector_store: Optional[PGVectorStore] = None


async def retrieve_documents(state: AgentState) -> dict:
    """
    Retrieve relevant documents from the vector store using PGVectorStore.

    This node takes the user's latest message, generates an embedding for it,
    and performs a similarity search in the database.

    Args:
        state (AgentState): The current state of the agent.

    Returns:
        dict: A dictionary with the updated documents list.
    """
    print("---NODE: RETRIEVE DOCUMENTS---")
    # This check ensures that the vector store has been initialized at startup.
    if vector_store is None:
        raise RuntimeError(
            "Vector store has not been initialized. "
            "Please ensure the application startup logic is correct."
        )

    user_query = state["messages"][-1].content

    # Perform similarity search with a metadata filter for the tenant_id.
    retrieved_docs = await vector_store.asimilarity_search(
        user_query, k=4, filter={"tenant_id": state["tenant_id"]}
    )

    print(f"---RETRIEVED {len(retrieved_docs)} DOCUMENTS---")
    for doc in retrieved_docs:
        print(f"  - Document ID: {doc.metadata.get('id', 'N/A')}")

    return {"documents": retrieved_docs}
