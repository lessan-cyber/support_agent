import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const CONTACT_RECIPIENT_EMAIL = process.env.CONTACT_RECIPIENT_EMAIL
const CONTACT_REPLY_TO = process.env.CONTACT_REPLY_TO

if (!RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set")
}

const resend = new Resend(RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name : ""
    const email = typeof body.email === "string" ? body.email : ""
    const message = typeof body.message === "string" ? body.message : ""

    if (!email || !message) {
      return NextResponse.json(
        { error: "Valid email and message are required" },
        { status: 400 }
      )
    }

    if (email.length > 320 || message.length > 5000) {
      return NextResponse.json(
        { error: "Email or message too long" },
        { status: 400 }
      )
    }

    const safeName = escapeHtml(name || "there")
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>")

    // Envoyer email de confirmation à l'utilisateur
    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: email,
      replyTo: CONTACT_REPLY_TO || "gbessayajoseph32@gmail.com",
      subject: "We received your message",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Thank you for contacting us!</h2>
          <p>Hi ${safeName},</p>
          <p>We've received your message and will get back to you as soon as possible.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <h3>Your message:</h3>
          <p>${safeMessage}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p>Best regards,<br><strong>Support Agent Team</strong></p>
        </div>
      `,
    })

    // Envoyer notification à gbessayajoseph32@gmail.com
    const notificationName = escapeHtml(name || "Not provided")
    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: CONTACT_RECIPIENT_EMAIL || "gbessayajoseph32@gmail.com",
      subject: `New contact form submission from ${escapeHtml(name || email)}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h3>New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${notificationName}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Message:</strong></p>
          <p>${safeMessage}</p>
        </div>
      `,
    })

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Resend error:", error)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}
