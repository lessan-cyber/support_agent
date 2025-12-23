"""
Semantic Cache Service using RedisVL for tenant-scoped caching.
Refactored based on RedisVL tutorial best practices.
"""

import json
import time
from typing import Any, Dict, Optional

import numpy as np
import redis.asyncio as redis
from redisvl.index import AsyncSearchIndex
from redisvl.query import VectorQuery
from redisvl.query.filter import Tag
from redisvl.schema import IndexSchema

# from app.services.embeddings import get_embedding_model
from app.settings import settings
from app.utils.logging_config import logger


class SemanticCache:
    """Tenant-scoped semantic cache using RedisVL with proper vector similarity search."""

    def __init__(self):
        self.redis_url = str(settings.REDIS_URL)
        self.index_name = "semantic_cache"
        self._index: Optional[AsyncSearchIndex] = None
        self._redis_client: Optional[redis.Redis] = None
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize the RedisVL index with proper schema."""
        if self._initialized:
            return

        try:
            # Create Redis client
            self._redis_client = redis.from_url(self.redis_url)

            # Test connection
            await self._redis_client.ping()

            # Define schema for our cache entries
            schema = IndexSchema.from_dict(
                {
                    "index": {
                        "name": self.index_name,
                        "prefix": f"{self.index_name}:",
                        "storage_type": "hash",
                    },
                    "fields": [
                        {"name": "tenant_id", "type": "tag"},
                        {"name": "query_text", "type": "text"},
                        {"name": "response", "type": "text"},
                        {
                            "name": "embedding",
                            "type": "vector",
                            "attrs": {
                                "dims": 384,  # BGE-small-en-v1.5 embedding dimension
                                "algorithm": "hnsw",
                                "distance_metric": "cosine",
                                "dtype": "float32",
                            },
                        },
                        {"name": "timestamp", "type": "numeric"},
                    ],
                }
            )

            logger.debug("Schema defined with embedding dims: 384")

            # Create async search index
            self._index = AsyncSearchIndex.from_dict(
                schema,
                redis_client=self._redis_client,
            )

            # Create the index in Redis
            try:
                await self._index.create(overwrite=False, drop=False)
                logger.debug("RedisVL index checked/created successfully")
            except Exception as e:
                logger.warning(f"Index creation warning: {e}")

            self._initialized = True
            logger.info("Semantic cache initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize semantic cache: {e}", exc_info=True)
            self._initialized = False

    async def get_cached_response(
        self, tenant_id: str, query_embedding: list[float], threshold: float = 0.9
    ) -> Optional[str]:
        """
        Check cache for similar queries using vector similarity search.

        Args:
            tenant_id: Tenant identifier for namespace isolation
            query_embedding: Embedding vector of the user query
            threshold: Similarity threshold (0.0 to 1.0, higher = more similar)

        Returns:
            Cached response if found and similar enough, None otherwise
        """
        if not self._initialized or not self._index:
            logger.debug("Cache not initialized, skipping cache check")
            return None

        try:
            start_time = time.time()

            # Create vector query with tenant filtering
            # Use Tag filter helper to safely handle UUIDs with hyphens
            tenant_filter = Tag("tenant_id") == tenant_id

            vector_query = VectorQuery(
                vector=query_embedding,
                vector_field_name="embedding",
                return_fields=["response", "query_text", "tenant_id"],
                num_results=1,  # We only need the top match
                filter_expression=tenant_filter,
            )

            # Execute the query
            results = await self._index.query(vector_query)

            cache_check_time = time.time() - start_time
            logger.debug(f"Cache check completed in {cache_check_time:.4f}s")

            if results and len(results) > 0:
                result = results[0]
                # Access fields as dictionary keys
                distance = float(result.get("vector_distance", 1.0))

                # Convert cosine distance to similarity (1 - distance)
                similarity = 1 - distance

                logger.debug(f"Found cache entry with similarity: {similarity:.4f}")
                logger.debug(f"Query embedding first 5 values: {query_embedding[:5]}")
                logger.debug(f"Cached query: '{result.get('query_text')}'")

                if similarity >= threshold:
                    logger.info(
                        f"Cache hit for tenant {tenant_id} (similarity: {similarity:.4f})"
                    )
                    return result.get("response")
                else:
                    logger.debug(
                        f"Cache miss: similarity {similarity:.4f} < threshold {threshold}"
                    )
                    return None
            else:
                logger.debug(f"Cache miss: no results found for tenant {tenant_id}")
                return None

        except Exception as e:
            logger.error(f"Cache lookup failed: {e}", exc_info=True)
            return None

    async def cache_response(
        self,
        tenant_id: str,
        query_embedding: list[float],
        query_text: str,
        response: str,
    ) -> bool:
        """
        Store a response in the cache with proper vector indexing.

        Args:
            tenant_id: Tenant identifier for namespace isolation
            query_embedding: Embedding vector of the user query
            query_text: Original query text (for reference)
            response: Response to cache

        Returns:
            True if caching succeeded, False otherwise
        """
        if not self._initialized or not self._index:
            logger.debug("Cache not initialized, cannot cache response")
            return False

        try:
            start_time = time.time()

            # Convert list[float] to bytes for Redis
            embedding_bytes = np.array(query_embedding, dtype=np.float32).tobytes()

            # Prepare data for caching
            data = {
                "tenant_id": tenant_id,
                "query_text": query_text,
                "response": response,
                "embedding": embedding_bytes,
                "timestamp": int(time.time()),
            }

            # Store in RedisVL index (it will handle the vector indexing)
            keys = await self._index.load([data])

            # Set TTL for the newly created cache entries
            if keys:
                for key in keys:
                    await self._redis_client.expire(key, settings.CACHE_TTL_SECONDS)

            cache_time = time.time() - start_time
            logger.debug(f"Caching completed in {cache_time:.4f}s")
            logger.info(f"Cached response for tenant {tenant_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to cache response: {e}", exc_info=True)
            # Fallback: try simple Redis hash storage if RedisVL fails
            try:
                cache_key = (
                    f"{self.index_name}:{tenant_id}:{hash(str(query_embedding))}"
                )
                embedding_json = json.dumps(query_embedding)
                await self._redis_client.hset(
                    cache_key,
                    mapping={
                        "tenant_id": tenant_id,
                        "query_text": query_text,
                        "response": response,
                        "embedding": embedding_json,
                        "timestamp": int(time.time()),
                    },
                )
                # Set TTL from settings
                await self._redis_client.expire(cache_key, settings.CACHE_TTL_SECONDS)
                logger.info(f"Cached response for tenant {tenant_id} (fallback method)")
                return True
            except Exception as fallback_error:
                logger.error(f"Fallback caching also failed: {fallback_error}")
                return False

    async def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the cache.

        Returns:
            Dictionary with cache statistics
        """
        if not self._initialized or not self._redis_client:
            return {"error": "Cache not initialized"}

        try:
            stats = {
                "total_entries": 0,
                "memory_usage": 0,
                "initialized": self._initialized,
            }

            # Get memory usage
            memory_info = await self._redis_client.info("memory")
            stats["memory_usage"] = memory_info.get("used_memory", 0)

            return stats

        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {"error": str(e)}

    async def close(self) -> None:
        """Clean up resources."""
        if self._redis_client:
            try:
                await self._redis_client.close()
            except Exception as e:
                logger.error(f"Error closing Redis connection: {e}")
        self._index = None
        self._redis_client = None
        self._embedding_model = None
        self._initialized = False


# Global cache instance (will be initialized during app startup)
semantic_cache = SemanticCache()
