"""User preferences admin endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_rls_session
from app.models.user import User
from app.schemas.user import UserPreferencesResponse, UserPreferencesUpdateRequest
from app.utils.logging_config import logger

router = APIRouter()


@router.get("", response_model=UserPreferencesResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
) -> UserPreferencesResponse:
    """Get current user preferences."""
    return UserPreferencesResponse(preferences=current_user.preferences)


@router.put("", response_model=UserPreferencesResponse)
async def update_preferences(
    request: UserPreferencesUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_session),
) -> UserPreferencesResponse:
    """Update user preferences (partial update)."""
    logger.info(f"User {current_user.id} updating preferences")

    try:
        current_prefs = (
            dict(current_user.preferences) if current_user.preferences else {}
        )

        update_data = request.model_dump(exclude_none=True)
        current_prefs.update(update_data)

        current_user.preferences = current_prefs
        await db.commit()
        await db.refresh(current_user)

        logger.info(f"User {current_user.id} preferences updated successfully")

        return UserPreferencesResponse(preferences=current_user.preferences)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(
            f"Failed to update preferences for user {current_user.id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preferences",
        ) from e
