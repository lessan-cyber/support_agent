"""API endpoints for document management."""

import asyncio
import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from uuid_extensions import uuid7 as uuid

from app.api.deps import get_current_user, get_rls_session, reusable_oauth2
from app.models.file import File, FileStatus
from app.models.user import User
from app.schemas.file import FileUploadResponse
from app.services.ingestion import upload_file_and_trigger_ingestion
from app.settings import settings
from app.utils.file_validator import validate_pdf
from app.utils.logging_config import logger

router = APIRouter()


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
    Handles the asynchronous part of the document ingestion process.
    """
    await validate_pdf(file)
    storage_path = f"{current_user.tenant_id}/{file.filename}"
    print(f"Uploading file: {file.filename}, storage_path: {storage_path}")
    db_file = File(
        tenant_id=current_user.tenant_id,
        filename=file.filename,
        storage_path=storage_path,
        status=FileStatus.UPLOADING,
    )
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)

    # Read file content in chunks to avoid buffering oversize uploads in memory
    # This avoids filesystem issues between Docker containers
    try:
        file_content = bytearray()
        chunk_size = 4096  # 4KB chunks
        total_size = 0
        
        while chunk := await file.read(chunk_size):
            total_size += len(chunk)
            if total_size > settings.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413, detail="File size exceeds the 40MB limit."
                )
            file_content.extend(chunk)
        
        # Convert to bytes for Celery task
        file_content = bytes(file_content)
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}")
        db_file.status = FileStatus.FAILED
        await db.commit()
        await db.refresh(db_file)
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500, detail="Failed to read uploaded file."
        ) from e

    try:
        # Upload file to storage first, then trigger processing
        task = upload_file_and_trigger_ingestion.delay(
            file_content=file_content,
            file_id=str(db_file.id),
            tenant_id=str(current_user.tenant_id),
            filename=file.filename,
        )
        response = db_file.__dict__
        response["task_id"] = task.id
        return FileUploadResponse.model_validate(response)
    except Exception as e:
        logger.error(f"Failed to trigger ingestion task: {e}")
        db_file.status = FileStatus.FAILED
        await db.commit()
        await db.refresh(db_file)
        raise HTTPException(
            status_code=500, detail="Failed to trigger document processing."
        ) from e
