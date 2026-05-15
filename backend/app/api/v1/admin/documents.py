"""Document listing admin endpoint."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_rls_session
from app.models.user import User
from app.schemas.document import DocumentListResponse
from app.services.document import document_service
from app.utils.logging_config import logger

router = APIRouter()


@router.get("", response_model=DocumentListResponse)
async def get_tenant_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
) -> DocumentListResponse:
    """
    Get all documents uploaded in the current tenant.

    This endpoint allows admins to view all files uploaded within their tenant.
    """
    logger.info(
        f"Admin {current_user.id} requesting all documents for tenant {current_user.tenant_id}"
    )

    try:
        documents = await document_service.get_tenant_files(
            tenant_id=current_user.tenant_id,
            db=db,
        )

        return DocumentListResponse(
            documents=documents,
            count=len(documents),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error retrieving documents: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve documents",
        ) from e
