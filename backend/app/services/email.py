"""Email notification service using Resend."""

from resend import Emails

from app.utils.logging_config import logger

SUPPORT_EMAIL = "Support Agent <onboarding@resend.dev>"
NOTIFICATION_EMAIL = "gbessayajoseph32@gmail.com"


async def send_resolution_email(
    user_email: str, ticket_id: str, answer: str
) -> None:
    """Send the human-provided answer to the user who created the ticket."""
    await Emails.send_async(
        {
            "from": SUPPORT_EMAIL,
            "to": user_email,
            "subject": f"Your support request #{ticket_id} has been answered",
            "html": (
                "<h2>Your support request has been resolved</h2>"
                "<p>Hello,</p>"
                f"<p>Your support request <strong>#{ticket_id}</strong> "
                "has been answered by our team.</p>"
                "<hr>"
                "<h3>Answer:</h3>"
                f"<p>{answer.replace(chr(10), '<br>')}</p>"
                "<hr>"
                "<p>If you have any further questions, "
                "please don't hesitate to reach out.</p>"
                "<p>Best regards,<br><strong>Support Agent Team</strong></p>"
            ),
        }
    )
    logger.info(f"Resolution email sent to {user_email} for ticket {ticket_id}")


async def send_contact_emails(
    user_name: str, user_email: str, message: str
) -> None:
    """Send contact form confirmation to the user and notification to support."""
    await Emails.send_async(
        {
            "from": SUPPORT_EMAIL,
            "to": user_email,
            "reply_to": NOTIFICATION_EMAIL,
            "subject": "We received your message",
            "html": (
                "<h2>Thank you for contacting us!</h2>"
                f"<p>Hi {user_name or 'there'},</p>"
                "<p>We've received your message and will get "
                "back to you as soon as possible.</p>"
                "<hr>"
                "<h3>Your message:</h3>"
                f"<p>{message.replace(chr(10), '<br>')}</p>"
                "<hr>"
                "<p>Best regards,<br><strong>Support Agent Team</strong></p>"
            ),
        }
    )

    await Emails.send_async(
        {
            "from": "Contact Form <onboarding@resend.dev>",
            "to": NOTIFICATION_EMAIL,
            "subject": f"New contact form submission from {user_name or user_email}",
            "html": (
                "<h3>New Contact Form Submission</h3>"
                f"<p><strong>Name:</strong> {user_name or 'Not provided'}</p>"
                f"<p><strong>Email:</strong> {user_email}</p>"
                "<p><strong>Message:</strong></p>"
                f"<p>{message.replace(chr(10), '<br>')}</p>"
            ),
        }
    )

    logger.info(f"Contact emails sent for {user_email}")
