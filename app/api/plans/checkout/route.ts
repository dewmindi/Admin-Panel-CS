import { NextResponse } from "next/server"
import { createCheckoutSession } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const { priceId, customerEmail, hostingCustomerId } = await request.json()

    if (!priceId || !customerEmail) {
      return NextResponse.json(
        { error: "Price ID and customer email are required" },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000"

    const session = await createCheckoutSession(
      priceId,
      customerEmail,
      `${baseUrl}/admin/hosting?checkout=success`,
      `${baseUrl}/admin/hosting?checkout=cancelled`,
      hostingCustomerId ? { hostingCustomerId } : undefined
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
