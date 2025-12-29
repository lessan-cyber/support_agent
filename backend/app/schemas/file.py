"""Pydantic schemas for file operations."""

import uuid

from pydantic import BaseModel, Field

from app.models.file import FileStatus


class FileUploadResponse(BaseModel):
    """Response schema for a file upload."""

    file_id: uuid.UUID = Field(
        ...,
        description="The unique identifier for the uploaded file.",
        alias="id",
    )
    filename: str = Field(..., description="The name of the uploaded file.")
    status: FileStatus = Field(..., description="The current status of the file.")
    task_id: str = Field(..., description="The ID of the background ingestion task.")
    model_config = {"from_attributes": True}
