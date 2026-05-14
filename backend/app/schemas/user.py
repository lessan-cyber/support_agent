"""User-related Pydantic schemas."""

from enum import Enum
from zoneinfo import available_timezones

from pydantic import BaseModel, Field, field_validator


class ViewMode(str, Enum):
    """Available view modes."""

    GRID = "grid"
    LIST = "list"


class UserPreferences(BaseModel):
    """User preferences schema."""

    language: str = Field(
        default="en",
        description="User's preferred language code (e.g., 'en', 'fr', 'es')",
        max_length=10,
    )
    timezone: str = Field(
        default="UTC",
        description="User's timezone (e.g., 'UTC', 'America/New_York')",
        max_length=50,
    )
    email_notifications: bool = Field(
        default=True,
        description="Whether to send email notifications",
    )
    default_view: ViewMode = Field(
        default=ViewMode.GRID,
        description="Default view mode ('grid' or 'list')",
    )
    items_per_page: int = Field(
        default=12,
        description="Number of items to display per page",
        ge=1,
        le=100,
    )
    auto_download: bool = Field(
        default=False,
        description="Whether to automatically download attachments",
    )

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        if value not in available_timezones():
            raise ValueError(f"Invalid timezone: {value}")
        return value


class UserPreferencesUpdateRequest(BaseModel):
    """Request schema for updating user preferences (partial update)."""

    language: str | None = Field(
        None,
        description="User's preferred language code",
        max_length=10,
    )
    timezone: str | None = Field(
        None,
        description="User's timezone",
        max_length=50,
    )
    email_notifications: bool | None = Field(
        None,
        description="Whether to send email notifications",
    )
    default_view: str | None = Field(
        None,
        description="Default view mode ('grid' or 'list')",
        max_length=20,
    )
    items_per_page: int | None = Field(
        None,
        description="Number of items to display per page",
        ge=1,
        le=100,
    )
    auto_download: bool | None = Field(
        None,
        description="Whether to automatically download attachments",
    )


class UserPreferencesResponse(BaseModel):
    """Response schema for user preferences."""

    preferences: UserPreferences
