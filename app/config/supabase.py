"""Supabase connection and client management."""

from supabase import AsyncClient, Client, acreate_client, create_client

from app.settings import settings
from app.utils import logger


async def get_supabase_client() -> AsyncClient:
    """Initializes and returns the Supabase async client."""
    return await acreate_client(str(settings.SUPABASE_URL), str(settings.SUPABASE_KEY))


def get_supabase_client_sync() -> Client:
    """Initializes and returns the Supabase sync client for Celery tasks."""
    # pyrefly: ignore [unknown-name]
    return create_client(str(settings.SUPABASE_URL), str(settings.SUPABASE_KEY))


async def check_supabase_connection():
    """
    Checks the connection to the Supabase client by listing buckets.
    Raises an exception if the connection fails.
    """
    try:
        supabase_client = await get_supabase_client()
        # Attempt to list buckets to verify connection
        await supabase_client.storage.list_buckets()
        logger.info("Supabase connection successful")
    except Exception as e:
        logger.error(f"Supabase connection error: {e}")
        raise
