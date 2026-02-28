import { NextResponse } from "next/server"
import {
  sendEmail,
  invoiceEmailTemplate,
  orderStatusEmailTemplate,
  hostingRenewalEmailTemplate,
} from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, to, data } = body

    if (!type || !to) {
      return NextResponse.json(
        { error: "Email type and recipient are required" },
        { status: 400 }
      )
    }

    let subject = ""
    let html = ""

    switch (type) {
      case "invoice": {
        const { customerName, invoiceNumber, items, total } = data
        subject = `Invoice #${invoiceNumber} - CS Graphic Meta`
        html = invoiceEmailTemplate(customerName, invoiceNumber, items, total)
        break
      }
      case "quote": {
        const { customerName, quoteNumber, items, total } = data
        subject = `Quote #${quoteNumber} - CS Graphic Meta`
        html = invoiceEmailTemplate(
          customerName,
          `Q-${quoteNumber}`,
          items,
          total
        )
        break
      }
      case "order-status": {
        const { customerName, orderId, status, message } = data
        subject = `Order Update - #${orderId}`
        html = orderStatusEmailTemplate(customerName, orderId, status, message)
        break
      }
      case "hosting-renewal": {
        const { customerName, domain, renewalDate, plan } = data
        subject = `Hosting Renewal Reminder - ${domain}`
        html = hostingRenewalEmailTemplate(
          customerName,
          domain,
          renewalDate,
          plan
        )
        break
      }
      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 }
        )
    }

    await sendEmail({ to, subject, html })

    return NextResponse.json({ success: true, subject })
  } catch (error) {
    console.error("Email send error:", error)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}
