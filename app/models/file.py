"""File model for tracking document ingestion status."""

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class FileStatus(enum.Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"


class File(BaseModel):
    __tablename__ = "files"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String, nullable=False)
    storage_path: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[FileStatus] = mapped_column(
        Enum(FileStatus, native_enum=False),
        nullable=False,
        default=FileStatus.UPLOADING,
    )

    def __repr__(self) -> str:
        return f"<File(id={self.id}, filename='{self.filename}', status='{self.status.value}')>"
