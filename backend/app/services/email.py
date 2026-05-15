"""Email notification service using Resend."""

import html

from resend import Emails
from resend.exceptions import ResendError

from app.settings import settings
from app.utils.logging_config import logger


async def send_resolution_email(user_email: str, ticket_id: str, answer: str) -> None:
    """Send the human-provided answer to the user who created the ticket."""
    escaped_answer = html.escape(answer).replace("\n", "<br>")
    escaped_ticket_id = html.escape(ticket_id)
    try:
        await Emails.send_async(
            {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": user_email,
                "subject": f"Your support request #{escaped_ticket_id} has been answered",
                "html": (
                    "<h2>Your support request has been resolved</h2>"
                    "<p>Hello,</p>"
                    f"<p>Your support request <strong>#{escaped_ticket_id}</strong> "
                    "has been answered by our team.</p>"
                    "<hr>"
                    "<h3>Answer:</h3>"
                    f"<p>{escaped_answer}</p>"
                    "<hr>"
                    "<p>If you have any further questions, "
                    "please don't hesitate to reach out.</p>"
                    "<p>Best regards,<br><strong>Support Agent Team</strong></p>"
                ),
            }
        )
        logger.info(f"Resolution email sent to {user_email} for ticket {ticket_id}")
    except ResendError as e:
        logger.warning(f"Failed to send resolution email: {e}")


async def send_contact_emails(user_name: str, user_email: str, message: str) -> None:
    """Send contact form confirmation to the user and notification to support."""
    escaped_name = html.escape(user_name) if user_name else ""
    escaped_message = html.escape(message).replace("\n", "<br>")
    try:
        await Emails.send_async(
            {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": user_email,
                "reply_to": settings.EMAIL_NOTIFICATION_ADDRESS,
                "subject": "We received your message",
                "html": (
                    "<h2>Thank you for contacting us!</h2>"
                    f"<p>Hi {escaped_name or 'there'},</p>"
                    "<p>We've received your message and will get "
                    "back to you as soon as possible.</p>"
                    "<hr>"
                    "<h3>Your message:</h3>"
                    f"<p>{escaped_message}</p>"
                    "<hr>"
                    "<p>Best regards,<br><strong>Support Agent Team</strong></p>"
                ),
            }
        )
    except ResendError as e:
        logger.warning(f"Failed to send contact confirmation: {e}")

    try:
        await Emails.send_async(
            {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": settings.EMAIL_NOTIFICATION_ADDRESS,
                "subject": f"New contact form submission from {escaped_name or user_email}",
                "html": (
                    "<h3>New Contact Form Submission</h3>"
                    f"<p><strong>Name:</strong> {escaped_name or 'Not provided'}</p>"
                    f"<p><strong>Email:</strong> {user_email}</p>"
                    "<p><strong>Message:</strong></p>"
                    f"<p>{escaped_message}</p>"
                ),
            }
        )
        logger.info(f"Contact notification sent for {user_email}")
    except ResendError as e:
        logger.warning(f"Failed to send contact notification: {e}")
