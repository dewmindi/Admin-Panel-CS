import { NextResponse } from "next/server"
import { sendEmail, hostingRenewalEmailTemplate } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { customerName, customerEmail, domain, renewalDate, plan } = await request.json()

    if (!customerEmail || !domain || !renewalDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const formattedDate = new Date(renewalDate).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    await sendEmail({
      to: customerEmail,
      subject: `Hosting Renewal Reminder - ${domain}`,
      html: hostingRenewalEmailTemplate(customerName, domain, formattedDate, plan),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Hosting notify error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
