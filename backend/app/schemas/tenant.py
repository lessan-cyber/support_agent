"""Pydantic schemas for tenant-related operations."""

import re
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class AllowedDomainBase(BaseModel):
    """Base schema for allowed domain."""

    domain: str = Field(..., description="Domain name without scheme or path")


class AllowedDomainCreate(AllowedDomainBase):
    """Schema for creating a new allowed domain."""

    pass


class AllowedDomainUpdate(AllowedDomainBase):
    """Schema for updating an allowed domain."""

    pass


class AllowedDomainResponse(AllowedDomainBase):
    """Schema for allowed domain response."""

    pass


class AllowedDomainsListResponse(BaseModel):
    """Schema for listing allowed domains."""

    tenant_id: str = Field(..., description="Tenant ID")
    domains: List[str] = Field(..., description="List of allowed domains")
    count: int = Field(..., description="Total count of allowed domains")


class AllowedDomainUpdateRequest(BaseModel):
    """Schema for updating an existing domain."""
    old_domain: str = Field(..., description="Existing domain to be replaced")
    new_domain: str = Field(..., description="New domain to replace the old one")


class AllowedDomainAddRequest(BaseModel):
    """Schema for adding one or more domains."""

    domains: List[str] = Field(..., min_items=1, description="List of domains to add")

    @field_validator("domains")
    @classmethod
    def validate_domains(cls, domains):
        """Validate domain format for each domain in the list."""
        domain_regex = re.compile(
            r"^(?!.*\.\.)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$"
        )

        validated_domains = []
        for domain in domains:
            if not domain:
                continue

            # Strip whitespace
            s_domain = domain.strip()

            # Strip scheme (http://, https://)
            s_domain = re.sub(r"^https?://", "", s_domain)

            # Strip trailing path/query if passed by mistake
            s_domain = s_domain.split("/")[0]

            if not domain_regex.match(s_domain):
                raise ValueError(
                    f"Invalid domain format: '{domain}' (sanitized: '{s_domain}')"
                )

            validated_domains.append(s_domain)

        return validated_domains
