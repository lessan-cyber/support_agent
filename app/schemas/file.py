"""Pydantic schemas for file operations."""

import uuid

from pydantic import BaseModel, Field

from app.models.file import FileStatus


class FileUploadResponse(BaseModel):
    """Response schema for a file upload."""

    file_id: uuid.UUID = Field(..., description="The unique identifier for the uploaded file.")
    filename: str = Field(..., description="The name of the uploaded file.")
    status: FileStatus = Field(..., description="The current status of the file.")

    class Config:
        from_attributes = True
