"""Supabase connection and client management."""

from supabase import AsyncClient, Client, acreate_client, create_client, StorageException, SupabaseException

from app.settings import settings
from app.utils.logging_config import logger

import asyncio
from typing import Optional

_supabase_admin_client: Optional[AsyncClient] = None
_supabase_admin_lock = asyncio.Lock()




async def supabase_admin() -> AsyncClient:
    global _supabase_admin_client
    async with _supabase_admin_lock:
        if _supabase_admin_client is None:
            _supabase_admin_client = await acreate_client(
                settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
            )
    return _supabase_admin_client


def supabase_admin_sync() -> Client:
    try:
        supabase_admin_client: Client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
        )
        return supabase_admin_client
    except SupabaseException as e:
        logger.error(f"Supabase sync client creation error: {e}")
        raise # Re-raise the specific exception


async def check_supabase_connection():
    """
    Checks the connection to the Supabase client by listing buckets.
    Raises an exception if the connection fails.
    """
    try:
        supabase_client = await supabase_admin()
        await supabase_client.storage.list_buckets()
        logger.info("Supabase connection successful")
    except StorageException as e:
        logger.error(f"Supabase connection error: {e}")
        raise
