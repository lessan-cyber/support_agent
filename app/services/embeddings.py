"""
Singleton service for text embeddings to avoid memory overhead of multiple instances.
"""

from typing import Optional
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from app.utils.logging_config import logger

import threading
from typing import Optional
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from app.utils.logging_config import logger

class EmbeddingService:
    _model: Optional[FastEmbedEmbeddings] = None
    _lock: threading.Lock = threading.Lock()

    @classmethod
    def get_model(cls) -> FastEmbedEmbeddings:
        """
        Get the singleton instance of the embedding model.
        Initializes it if it doesn't exist.
        """
        if cls._model is None:
            with cls._lock:
                if cls._model is None:  # Double-check after acquiring lock
                    logger.info("Initializing shared Embedding Model (BAAI/bge-small-en-v1.5)...")
                    try:
                        cls._model = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
                        logger.info("Embedding Model initialized successfully.")
                    except (RuntimeError, ValueError, OSError) as e:
                        logger.error(f"Failed to initialize Embedding Model: {e}")
                        raise
        return cls._model

# Global convenience accessor
def get_embedding_model() -> FastEmbedEmbeddings:
    return EmbeddingService.get_model()
