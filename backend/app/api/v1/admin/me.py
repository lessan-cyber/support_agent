"""Authenticated user info admin endpoint."""

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import TenantInfo, UserInfoResponse, UserPreferences

router = APIRouter()


@router.get("/me", response_model=UserInfoResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> UserInfoResponse:
    """Return authenticated user info including tenant details."""
    return UserInfoResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value,
        tenant=TenantInfo(
            id=str(current_user.tenant.id),
            name=current_user.tenant.name,
            plan=current_user.tenant.plan,
            allowed_domains=current_user.tenant.allowed_domains,
        ),
        preferences=UserPreferences(**current_user.preferences),
    )
