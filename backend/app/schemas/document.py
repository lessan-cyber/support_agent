"""Schemas for document-related responses."""

import uuid
from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    """Response schema for document metadata with download link."""
    id: uuid.UUID
    filename: str
    created_at: datetime
    download_url: str
    file_size: int
    content_type: str
    tenant_id: uuid.UUID


class DocumentListResponse(BaseModel):
    """Response schema for list of documents."""
    documents: list[DocumentResponse]
    count: int
