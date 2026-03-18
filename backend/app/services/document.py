"""Service layer for document-related operations."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.supabase import supabase_admin
from app.models.file import File
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.settings import settings
from app.utils.logging_config import logger


class DocumentService:
    """Service for document operations with business logic."""

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

        # Fetch all files for this tenant (RLS ensures tenant isolation)
        files_result = await db.execute(
            select(File)
            .where(File.tenant_id == tenant_id)
            .order_by(File.created_at.desc())
        )
        files = files_result.scalars().all()

        # Get supabase client
        supabase_client = await supabase_admin()

        # Generate signed URLs for each file
        document_responses = []
        for file in files:
            try:
                # Generate signed URL for Supabase storage (must await)
                # Note: expiresIn must be an integer (seconds), not a timedelta object
                signed_url_data = await supabase_client.storage.from_(
                    settings.KNOWLEDGE_BASE_BUCKET
                ).create_signed_url(
                    file.storage_path,
                    86400,  # 1 day in seconds (24 * 60 * 60)
                )

                # Extract the actual URL string from the Supabase response
                # Supabase returns an object with 'signedURL' property
                if isinstance(signed_url_data, dict):
                    signed_url = signed_url_data.get(
                        "signedURL"
                    ) or signed_url_data.get("signed_url")
                else:
                    # Fallback for different response formats
                    signed_url = str(signed_url_data)

                # Debug: log the actual response format
                logger.debug(
                    f"Supabase signed URL response type: {type(signed_url_data)}"
                )
                if isinstance(signed_url_data, dict):
                    logger.debug(
                        f"Supabase response keys: {list(signed_url_data.keys())}"
                    )

                # Get file size from Supabase (fallback to 0 if not available)
                file_size = 0
                try:
                    file_info = await supabase_client.storage.from_(
                        settings.KNOWLEDGE_BASE_BUCKET
                    ).get_file_info(file.storage_path)
                    file_size = file_info.size if hasattr(file_info, "size") else 0
                except Exception:
                    logger.debug(f"Could not get file size for {file.storage_path}")

                document_response = DocumentResponse(
                    id=file.id,
                    filename=file.filename,
                    created_at=file.created_at,
                    download_url=signed_url,
                    file_size=file_size,
                    content_type="application/pdf",  # Default to PDF, could be enhanced
                    tenant_id=file.tenant_id,
                )
                document_responses.append(document_response)

            except Exception as e:
                logger.error(f"Failed to generate signed URL for file {file.id}: {e}")
                # Continue with other files even if one fails
                continue

        logger.info(f"Found {len(document_responses)} files for tenant {tenant_id}")
        return document_responses


# Initialize service instance
document_service = DocumentService()
