"""File validation utilities."""

from fastapi import HTTPException, UploadFile

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPE = "application/pdf"


async def validate_pdf(file: UploadFile) -> None:
    """
    Validates that an uploaded file is a PDF and is within the size limit.

    Args:
        file: The file uploaded via a FastAPI endpoint.

    Raises:
        HTTPException: If the file is not a PDF or exceeds the size limit.
    """
    file_content = await file.read()
    # After reading, immediately reset the file pointer for subsequent operations.
    await file.seek(0)

    if not file_content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file content. File does not appear to be a valid PDF.",
        )

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds the 10MB limit.")
