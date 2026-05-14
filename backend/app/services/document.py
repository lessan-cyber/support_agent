"""Service layer for document-related operations."""

import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.supabase import supabase_admin
from app.models.file import File
from app.schemas.document import DocumentResponse
from app.settings import settings
from app.utils.logging_config import logger


class DocumentService:
    """Service for document operations with business logic."""

    @staticmethod
    async def _build_document_response(
        file: File, supabase_client
    ) -> DocumentResponse | None:
        """Build a DocumentResponse for a single file with signed URL and metadata."""
        try:
            signed_url_data, file_info = await asyncio.gather(
                supabase_client.storage.from_(
                    settings.KNOWLEDGE_BASE_BUCKET
                ).create_signed_url(file.storage_path, 86400),
                supabase_client.storage.from_(settings.KNOWLEDGE_BASE_BUCKET).info(
                    file.storage_path
                ),
                return_exceptions=True,
            )

            if isinstance(signed_url_data, Exception):
                logger.error(
                    f"Failed to generate signed URL for file {file.id}: {signed_url_data}"
                )
                return None

            if isinstance(signed_url_data, dict):
                signed_url = signed_url_data.get("signedURL") or signed_url_data.get(
                    "signed_url"
                )
            else:
                signed_url = str(signed_url_data)

            file_size = 0
            if isinstance(file_info, dict):
                file_size = file_info.get("metadata", {}).get("size", 0) or 0

            return DocumentResponse(
                id=file.id,
                filename=file.filename,
                created_at=file.created_at,
                download_url=signed_url,
                file_size=file_size,
                content_type="application/pdf",
                tenant_id=file.tenant_id,
            )

        except Exception as e:
            logger.error(f"Failed to process file {file.id}: {e}")
            return None

    @staticmethod
    async def get_tenant_files(
        tenant_id: uuid.UUID, db: AsyncSession
    ) -> list[DocumentResponse]:
        """
        Get all files uploaded in a specific tenant.

        Args:
            tenant_id: The tenant ID for RLS context
            db: Database session with RLS already configured

        Returns:
            List of DocumentResponse objects
        """
        logger.info(f"Fetching all files for tenant {tenant_id}")

        files_result = await db.execute(
            select(File)
            .where(File.tenant_id == tenant_id)
            .order_by(File.created_at.desc())
        )
        files = files_result.scalars().all()

        if not files:
            return []

        supabase_client = await supabase_admin()

        results = await asyncio.gather(
            *[
                DocumentService._build_document_response(file, supabase_client)
                for file in files
            ]
        )

        document_responses = [r for r in results if r is not None]

        logger.info(f"Found {len(document_responses)} files for tenant {tenant_id}")
        return document_responses


# Initialize service instance
document_service = DocumentService()
