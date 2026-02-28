import { NextResponse } from "next/server"
import { sendEmail, orderStatusEmailTemplate } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { customerName, customerEmail, orderId, status, message } = await request.json()

    if (!customerEmail || !orderId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await sendEmail({
      to: customerEmail,
      subject: `Order Update - #${orderId.slice(-6).toUpperCase()}`,
      html: orderStatusEmailTemplate(customerName, orderId.slice(-6).toUpperCase(), status, message),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Order notify error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
