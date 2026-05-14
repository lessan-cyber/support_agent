"""Contact form email endpoint — sends emails via Resend."""

from pydantic import BaseModel, EmailStr, Field
from resend import Emails

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models.user import User
from app.settings import settings
from app.utils.logging_config import logger

router = APIRouter()


class ContactFormRequest(BaseModel):
    name: str = Field("", max_length=255)
    email: EmailStr
    message: str = Field(..., min_length=1, max_length=5000)


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
        user_email = str(request.email)

        await Emails.send_async(
            {
                "from": "Support Agent <onboarding@resend.dev>",
                "to": user_email,
                "reply_to": "gbessayajoseph32@gmail.com",
                "subject": "We received your message",
                "html": (
                    "<h2>Thank you for contacting us!</h2>"
                    f"<p>Hi {request.name or 'there'},</p>"
                    "<p>We've received your message and will get back to you as soon as possible.</p>"
                    "<hr>"
                    f"<h3>Your message:</h3>"
                    f"<p>{request.message.replace(chr(10), '<br>')}</p>"
                    "<hr>"
                    "<p>Best regards,<br><strong>Support Agent Team</strong></p>"
                ),
            }
        )

        await Emails.send_async(
            {
                "from": "Contact Form <onboarding@resend.dev>",
                "to": "gbessayajoseph32@gmail.com",
                "subject": f"New contact form submission from {request.name or request.email}",
                "html": (
                    "<h3>New Contact Form Submission</h3>"
                    f"<p><strong>Name:</strong> {request.name or 'Not provided'}</p>"
                    f"<p><strong>Email:</strong> {user_email}</p>"
                    f"<p><strong>Message:</strong></p>"
                    f"<p>{request.message.replace(chr(10), '<br>')}</p>"
                ),
            }
        )

        return {"success": True, "message": "Email sent successfully"}

    except Exception as e:
        logger.error(f"Failed to send contact email: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email",
        ) from e
