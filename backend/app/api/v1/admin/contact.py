"""Contact form email endpoint — sends emails via Resend."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.api.deps import get_current_user
from app.models.user import User
from app.services.email import send_contact_emails
from app.utils.logging_config import logger

router = APIRouter()


class ContactFormRequest(BaseModel):
    name: str = Field("", max_length=255)
    email: EmailStr
    message: str = Field(..., min_length=10, max_length=5000)


@router.post("", response_model=dict)
async def send_contact_email(
    request: ContactFormRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Send a contact form email.

    Sends a confirmation to the user and a notification to the support team.
    Uses the Resend SDK with the API key configured in settings.
    """
    logger.info(f"User {current_user.id} submitting contact form")

    try:
        await send_contact_emails(
            user_name=request.name,
            user_email=str(request.email),
            message=request.message,
        )

        return {"success": True, "message": "Email sent successfully"}

    except Exception as e:
        logger.error(f"Failed to send contact email: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email",
        ) from e
