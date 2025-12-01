"""Supabase connection and client management."""

from supabase import AsyncClient, Client, acreate_client, create_client

from app.settings import settings
from app.utils.logging_config import logger


async def supabase_admin() -> AsyncClient:
    supabase_admin: AsyncClient = await acreate_client(
        settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
    )
    return supabase_admin


def supabase_admin_sync() -> Client:
    supabase_admin: Client = create_client(
        settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
    )

    return supabase_admin


async def check_supabase_connection():
    """
    Checks the connection to the Supabase client by listing buckets.
    Raises an exception if the connection fails.
    """
    try:
        supabase_client = await supabase_admin()
        await supabase_client.storage.list_buckets()
        logger.info("Supabase connection successful")
    except Exception as e:
        logger.error(f"Supabase connection error: {e}")
        raise
