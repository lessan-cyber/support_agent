"""File validation utilities."""

from fastapi import HTTPException, UploadFile

ALLOWED_CONTENT_TYPE = "application/pdf"


async def validate_pdf(file: UploadFile) -> None:
    """
    Validates that an uploaded file is a PDF.

    Args:
        file: The file uploaded via a FastAPI endpoint.

    Raises:
        HTTPException: If the file is not a PDF.
    """
    if file.content_type != ALLOWED_CONTENT_TYPE:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Only {ALLOWED_CONTENT_TYPE} is accepted.",
        )
    
    magic_bytes = await file.read(5)
    await file.seek(0)

    if magic_bytes != b"%PDF-":
        raise HTTPException(
            status_code=400,
            detail="Invalid file content. File does not appear to be a valid PDF.",
        )
