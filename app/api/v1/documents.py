"""API endpoints for document management."""

import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_rls_session
from app.models.file import File, FileStatus
from app.models.user import User
from app.schemas.file import FileUploadResponse
from app.services.ingestion import ingest_pdf
from app.services.storage import upload_to_storage
from app.utils.file_validator import validate_pdf

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/upload",
    status_code=202,
    response_model=FileUploadResponse,
    summary="Upload a document for ingestion",
    description="Accepts a PDF file, creates a record in the database, and triggers the ingestion workflow.",
)
async def upload_document(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
) -> FileUploadResponse:
    """
    Handles the synchronous part of the document ingestion process.
    """
    await validate_pdf(file)

    storage_path = f"{current_user.tenant_id}/{file.filename}"
    db_file = File(
        tenant_id=current_user.tenant_id,
        filename=file.filename,
        storage_path=storage_path,
        status=FileStatus.UPLOADING,
    )
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)

    try:
        # The file.file is a SpooledTemporaryFile, which needs to be read from the beginning
        await upload_to_storage(file_stream=file.file, storage_path=storage_path)
        db_file.status = FileStatus.PROCESSING
        await db.commit()
        await db.refresh(db_file)

        # Trigger the Celery task
        # pyrefly: ignore [not-callable]
        ingest_pdf.delay(
            file_id=str(db_file.id),
            tenant_id=str(db_file.tenant_id),
            storage_path=db_file.storage_path,
        )

    except Exception as e:
        logger.error(
            f"Failed to upload file to storage for file_id: {db_file.id}. Error: {e}"
        )
        db_file.status = FileStatus.FAILED
        await db.commit()
        raise HTTPException(status_code=500, detail="Failed to upload file to storage.")

    return FileUploadResponse.model_validate(db_file)
