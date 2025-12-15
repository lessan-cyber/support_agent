"""Utility functions for validating tenant-related information."""

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import Tenant
from app.settings import settings


async def validate_tenant_and_origin(
    request: Request, tenant_id: str, db_session: AsyncSession
) -> Tenant:
    """
    Validates the origin domain against the tenant's allowed domains
    and retrieves the tenant object.

    Args:
        request (Request): The FastAPI request object.
        tenant_id (str): The ID of the tenant to validate.
        db_session (AsyncSession): The SQLAlchemy async database session.

    Returns:
        Tenant: The validated Tenant object.

    Raises:
        HTTPException: If the origin header is missing, tenant is not found,
                       or the domain is not allowed.
    """
    origin = request.headers.get("origin")
    if not origin and not settings.DEBUG:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing Origin header")

    tenant = await db_session.scalar(select(Tenant).where(Tenant.id == tenant_id))

    if not tenant:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tenant not found")

    if not settings.DEBUG and origin not in tenant.allowed_domains:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Domain not allowed")

    return tenant
