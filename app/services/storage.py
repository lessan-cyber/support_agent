"""Service for interacting with Supabase Storage."""

from typing import BinaryIO
from app.config.supabase import supabase_admin, supabase_admin_sync
from app.settings import settings
from app.utils.logging_config import logger


async def upload_to_storage(file_stream: BinaryIO, storage_path: str):
    """
    Uploads a file to the Supabase storage bucket.
    """
    supabase_client = await supabase_admin()
    try:
        await supabase_client.storage.from_(settings.KNOWLEDGE_BASE_BUCKET).upload(
            path=storage_path,
            file=file_stream,
        )
        logger.info(f"File uploaded to storage at path: {storage_path}")
    except Exception as exc:
        logger.error(f"Failed to upload file to storage: {exc}", exc_info=True)
        raise

def upload_to_storage_sync(file_stream: BinaryIO, storage_path: str) -> None:
    """
    Uploads a file to the Supabase storage bucket synchronously.
    """
    supabase_client = supabase_admin_sync()
    try:
        supabase_client.storage.from_(settings.KNOWLEDGE_BASE_BUCKET).upload(
            path=storage_path,
            file=file_stream,
        )
        logger.info(f"File uploaded to storage at path: {storage_path}")
    except Exception as exc:
        logger.error(f"Failed to upload file to storage: {exc}", exc_info=True)
        raise
