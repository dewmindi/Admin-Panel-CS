import { NextResponse } from "next/server"
import { loginSchema } from "@/lib/schemas"
import { createOTP, getSession } from "@/lib/auth"
import { sendEmail, otpEmailTemplate } from "@/lib/email"
import { connectToDatabase } from "@/lib/mongodb"

const ALLOWED_EMAILS = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || []

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = loginSchema.parse(body)

    // Check if email is allowed
    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
      return NextResponse.json(
        { error: "This email is not authorized to access the admin panel." },
        { status: 403 }
      )
    }

    // Check for existing remembered session
    const session = await getSession()
    if (session && session.email === email && session.rememberMe) {
      return NextResponse.json({ skipOtp: true })
    }

    // Ensure admin exists
    const { db } = await connectToDatabase()
    let admin = await db.collection("admins").findOne({ email })
    if (!admin) {
      await db.collection("admins").insertOne({
        email,
        name: email.split("@")[0],
        role: "admin",
        createdAt: new Date(),
      })
    }

    const otp = await createOTP(email)
    await sendEmail({
      to: email,
      subject: "Your Admin Login Code - CS Graphic Meta",
      html: otpEmailTemplate(otp),
    })

    return NextResponse.json({ success: true, message: "OTP sent to your email" })
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    )
  }
}
