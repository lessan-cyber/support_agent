"""Redis connection and client management."""

import redis.asyncio as redis
from app.settings import settings
from app.utils import logger


async def check_redis_connection():
    """
    Checks the connection to the Redis server.
    Raises an exception if the connection fails.
    """
    try:
        # Create a Redis client from the URL using async context manager
        async with redis.from_url(
            str(settings.REDIS_URL), encoding="utf-8", decode_responses=True
        ) as redis_client:
            # Ping the server
            if await redis_client.ping():
                logger.info("Redis connection successful")
            else:
                raise ConnectionError(
                    "Redis connection failed: PING command returned False"
                )
    except Exception as e:
        logger.error(f"Redis connection error: {e}")
        raise
