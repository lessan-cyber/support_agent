"""API endpoints for document management."""

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
    db_file = File(
        tenant_id=current_user.tenant_id,
        filename=file.filename,
        storage_path=storage_path,
        status=FileStatus.UPLOADING,
    )
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)

    temp_dir = "temp_files"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, f"{uuid()}_{file.filename}")

    try:
        total_size = 0
        with open(temp_file_path, "wb") as buffer:
            while chunk := await file.read(4096):
                total_size += len(chunk)
                if total_size > settings.MAX_FILE_SIZE:
                    os.remove(temp_file_path)
                    raise HTTPException(
                        status_code=413, detail="File size exceeds the 20MB limit."
                    )
                buffer.write(chunk)

    except Exception as e:
        logger.error(f"Failed to save uploaded file locally: {e}")
        db_file.status = FileStatus.FAILED
        await db.commit()
        await db.refresh(db_file)
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500, detail="Failed to save uploaded file."
        ) from e

    task = upload_file_and_trigger_ingestion.delay(  # pyright: ignore[reportFunctionMemberAccess]
        local_file_path=temp_file_path,
        file_id=str(db_file.id),
        tenant_id=str(current_user.tenant_id),
        filename=file.filename,
    )
    response = db_file.__dict__
    response["task_id"] = task.id
    return FileUploadResponse.model_validate(response)
