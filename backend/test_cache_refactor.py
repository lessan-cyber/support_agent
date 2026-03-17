#!/usr/bin/env python3
"""
Test script to verify the refactored cache implementation.
"""

import asyncio
import os

# from dotenv import load_dotenv
from app.services.cache import semantic_cache
from app.settings import settings

# Load environment variables
# load_dotenv()


async def test_cache():
    """Test the refactored cache implementation."""

    print("🧪 Testing refactored semantic cache...")

    # Initialize cache
    print("\n1. Initializing cache...")
    await semantic_cache.initialize()

    if not semantic_cache._initialized:
        print("❌ Cache initialization failed")
        return False

    print("✅ Cache initialized successfully")

    # Test cache miss
    print("\n2. Testing cache miss...")
    test_tenant = "test-tenant-123"
    test_query = "What is the capital of France?"
    test_embedding = [0.1, 0.2, 0.3] * 128  # Mock embedding (384 dims)

    cached_response = await semantic_cache.get_cached_response(
        tenant_id=test_tenant,
        query_embedding=test_embedding,
        threshold=settings.CACHE_SIMILARITY_THRESHOLD,
    )

    if cached_response is None:
        print("✅ Cache miss handled correctly")
    else:
        print("❌ Expected cache miss but got a hit")
        return False

    # Test caching
    print("\n3. Testing caching...")
    test_response = "The capital of France is Paris."

    cache_success = await semantic_cache.cache_response(
        tenant_id=test_tenant,
        query_embedding=test_embedding,
        query_text=test_query,
        response=test_response,
    )

    if cache_success:
        print("✅ Response cached successfully")
    else:
        print("❌ Failed to cache response")
        return False

    # Test cache hit
    print("\n4. Testing cache hit...")
    cached_response = await semantic_cache.get_cached_response(
        tenant_id=test_tenant,
        query_embedding=test_embedding,
        threshold=settings.CACHE_SIMILARITY_THRESHOLD,
    )

    if cached_response == test_response:
        print("✅ Cache hit returned correct response")
    else:
        print(f"❌ Expected '{test_response}' but got '{cached_response}'")
        return False

    # Test tenant isolation
    print("\n5. Testing tenant isolation...")
    different_tenant = "different-tenant-456"

    cached_response = await semantic_cache.get_cached_response(
        tenant_id=different_tenant,
        query_embedding=test_embedding,
        threshold=settings.CACHE_SIMILARITY_THRESHOLD,
    )

    if cached_response is None:
        print("✅ Tenant isolation working correctly")
    else:
        print("❌ Tenant isolation failed - got response from different tenant")
        return False

    # Test cache stats
    print("\n6. Testing cache stats...")
    stats = await semantic_cache.get_cache_stats()

    if "initialized" in stats and stats["initialized"]:
        print("✅ Cache stats working correctly")
        print(f"   Stats: {stats}")
    else:
        print("❌ Cache stats failed")
        return False

    # Clean up
    print("\n7. Cleaning up...")
    await semantic_cache.close()
    print("✅ Cache closed successfully")

    print("\n🎉 All tests passed!")
    return True


if __name__ == "__main__":
    success = asyncio.run(test_cache())
    exit(0 if success else 1)
