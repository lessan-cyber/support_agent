"""Allowed domains admin endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_rls_session
from app.models.user import User
from app.schemas.tenant import (
    AllowedDomainAddRequest,
    AllowedDomainsListResponse,
    AllowedDomainUpdateRequest,
)
from app.services.tenant import TenantService
from app.utils.logging_config import logger

router = APIRouter()


def _verify_tenant_access(current_user: User, tenant_id: uuid.UUID) -> None:
    if str(current_user.tenant_id) != str(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have access to this tenant",
        )


@router.get(
    "/{tenant_id}/allowed-domains", response_model=AllowedDomainsListResponse
)
async def get_allowed_domains(
    tenant_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
):
    """Get list of allowed domains for a tenant."""
    logger.info(
        f"User {current_user.id} requesting allowed domains for tenant {tenant_id}"
    )

    try:
        _verify_tenant_access(current_user, tenant_id)

        domains = await TenantService.get_allowed_domains(str(tenant_id), db)
        return AllowedDomainsListResponse(
            tenant_id=tenant_id,
            domains=domains,
            count=len(domains),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to retrieve allowed domains for tenant {tenant_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve allowed domains",
        ) from e


@router.post(
    "/{tenant_id}/allowed-domains", response_model=AllowedDomainsListResponse
)
async def add_allowed_domains(
    tenant_id: uuid.UUID,
    request: AllowedDomainAddRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
):
    """Add one or more domains to a tenant's allowed domains list."""
    logger.info(f"User {current_user.id} adding domains to tenant {tenant_id}")

    try:
        _verify_tenant_access(current_user, tenant_id)

        domains = await TenantService.add_allowed_domains(
            str(tenant_id), request.domains, db
        )

        logger.info(f"Added {len(request.domains)} domains to tenant {tenant_id}")

        return AllowedDomainsListResponse(
            tenant_id=tenant_id,
            domains=domains,
            count=len(domains),
        )

    except HTTPException:
        raise
    except ValueError as e:
        await db.rollback()
        logger.warning(f"Failed to add domains to tenant {tenant_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to add domains to tenant {tenant_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add allowed domains",
        ) from e


@router.delete(
    "/{tenant_id}/allowed-domains/{domain}",
    response_model=AllowedDomainsListResponse,
)
async def remove_allowed_domain(
    tenant_id: uuid.UUID,
    domain: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
):
    """Remove a domain from a tenant's allowed domains list."""
    logger.info(
        f"User {current_user.id} removing domain '{domain}' from tenant {tenant_id}"
    )

    try:
        _verify_tenant_access(current_user, tenant_id)

        domains = await TenantService.remove_allowed_domain(str(tenant_id), domain, db)

        logger.info(f"Removed domain '{domain}' from tenant {tenant_id}")

        return AllowedDomainsListResponse(
            tenant_id=tenant_id,
            domains=domains,
            count=len(domains),
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(
            f"Failed to remove domain from tenant {tenant_id}: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove allowed domain",
        ) from e


@router.put(
    "/{tenant_id}/allowed-domains", response_model=AllowedDomainsListResponse
)
async def update_allowed_domain(
    tenant_id: uuid.UUID,
    request: AllowedDomainUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
):
    """Update an existing domain in a tenant's allowed domains list."""
    logger.info(f"User {current_user.id} updating domain in tenant {tenant_id}")

    try:
        _verify_tenant_access(current_user, tenant_id)

        domains = await TenantService.update_allowed_domain(
            str(tenant_id), request.old_domain, request.new_domain, db
        )

        logger.info(
            f"Updated domain '{request.old_domain}' to '{request.new_domain}' for tenant {tenant_id}"
        )

        return AllowedDomainsListResponse(
            tenant_id=tenant_id,
            domains=domains,
            count=len(domains),
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(
            f"Failed to update domain in tenant {tenant_id}: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update allowed domain",
        ) from e
