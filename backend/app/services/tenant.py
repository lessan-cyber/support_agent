"""Tenant service layer for domain management operations."""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tenant import Tenant
from app.utils.logging_config import logger


class TenantService:
    """Service class for tenant-related operations."""

    @staticmethod
    async def get_tenant_by_id(
        tenant_id: str, db: AsyncSession
    ) -> Optional[Tenant]:
        """Get tenant by ID."""
        result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_allowed_domains(
        tenant_id: str, db: AsyncSession
    ) -> List[str]:
        """Get list of allowed domains for a tenant."""
        tenant = await TenantService.get_tenant_by_id(tenant_id, db)
        if tenant:
            return tenant.allowed_domains or []
        return []

    @staticmethod
    async def add_allowed_domains(
        tenant_id: str, domains: List[str], db: AsyncSession
    ) -> List[str]:
        """Add domains to a tenant's allowed domains list."""
        tenant = await TenantService.get_tenant_by_id(tenant_id, db)
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")

        existing_domains = set(tenant.allowed_domains or [])
        
        # Check for duplicates
        duplicates = [domain for domain in domains if domain in existing_domains]
        if duplicates:
            raise ValueError(f"Domains already exist: {', '.join(duplicates)}")

        # Add new domains
        updated_domains = list(existing_domains) + domains
        tenant.allowed_domains = updated_domains
        
        await db.commit()
        await db.refresh(tenant)
        
        logger.info(f"Added {len(domains)} domains to tenant {tenant_id}")
        
        return tenant.allowed_domains or []

    @staticmethod
    async def update_allowed_domain(
        tenant_id: str, old_domain: str, new_domain: str, db: AsyncSession
    ) -> List[str]:
        """Update an existing domain in a tenant's allowed domains list."""
        tenant = await TenantService.get_tenant_by_id(tenant_id, db)
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")

        current_domains = tenant.allowed_domains or []
        
        # Check if old domain exists
        if old_domain not in current_domains:
            raise ValueError(f"Domain '{old_domain}' not found in allowed domains")
        
        # Check if new domain already exists
        if new_domain in current_domains:
            raise ValueError(f"Domain '{new_domain}' already exists in allowed domains")

        # Update domain
        updated_domains = [new_domain if d == old_domain else d for d in current_domains]
        tenant.allowed_domains = updated_domains
        
        await db.commit()
        await db.refresh(tenant)
        
        logger.info(f"Updated domain '{old_domain}' to '{new_domain}' for tenant {tenant_id}")
        
        return tenant.allowed_domains or []

    @staticmethod
    async def remove_allowed_domain(
        tenant_id: str, domain: str, db: AsyncSession
    ) -> List[str]:
        """Remove a domain from a tenant's allowed domains list."""
        tenant = await TenantService.get_tenant_by_id(tenant_id, db)
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")

        current_domains = tenant.allowed_domains or []
        
        # Check if domain exists
        if domain not in current_domains:
            raise ValueError(f"Domain '{domain}' not found in allowed domains")

        # Remove domain
        updated_domains = [d for d in current_domains if d != domain]
        tenant.allowed_domains = updated_domains
        
        await db.commit()
        await db.refresh(tenant)
        
        logger.info(f"Removed domain '{domain}' from tenant {tenant_id}")
        
        return tenant.allowed_domains or []