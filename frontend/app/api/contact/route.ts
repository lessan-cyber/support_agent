import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json()

    // Validation basique
    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      )
    }

    // Envoyer email de confirmation à l'utilisateur
    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: email,
      replyTo: "gbessayajoseph32@gmail.com",
      subject: "We received your message",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Thank you for contacting us!</h2>
          <p>Hi ${name || "there"},</p>
          <p>We've received your message and will get back to you as soon as possible.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <h3>Your message:</h3>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p>Best regards,<br><strong>Support Agent Team</strong></p>
        </div>
      `,
    })

    // Envoyer notification à gbessayajoseph32@gmail.com
    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: "gbessayajoseph32@gmail.com",
      subject: `New contact form submission from ${name || email}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h3>New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${name || "Not provided"}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
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
