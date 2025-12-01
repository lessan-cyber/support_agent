"""API endpoints for document management."""

import logging
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_rls_session, reusable_oauth2
from app.models.file import File, FileStatus
from app.models.user import User
from app.schemas.file import FileUploadResponse
from app.services.ingestion import upload_file_and_trigger_ingestion
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
    token: HTTPBearer = Depends(reusable_oauth2),
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

    # Save the file to a temporary local directory
    try:
        # Create a temporary directory if it doesn't exist
        temp_dir = "temp_files"
        os.makedirs(temp_dir, exist_ok=True)
        # Use a unique filename to avoid collisions
        temp_file_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")

        with open(temp_file_path, "wb") as buffer:
            # Need to read the file again after validation
            await file.seek(0)
            buffer.write(await file.read())

    except Exception as e:
        logger.error(f"Failed to save uploaded file locally: {e}")
        db_file.status = FileStatus.FAILED
        await db.commit()
        await db.refresh(db_file)
        raise HTTPException(
            status_code=500, detail="Failed to save uploaded file."
        ) from e

    # Dispatch the upload and ingestion task
    task = upload_file_and_trigger_ingestion.delay(
        local_file_path=temp_file_path,
        file_id=str(db_file.id),
        tenant_id=str(current_user.tenant_id),
        filename=file.filename,
    )

    return FileUploadResponse(
        id=db_file.id,
        filename=db_file.filename,
        status=db_file.status,
        task_id=task.id,
    )
