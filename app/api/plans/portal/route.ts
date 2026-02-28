import { NextResponse } from "next/server"
import { createCustomerPortalSession } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const { stripeCustomerId } = await request.json()

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "Stripe customer ID is required" },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000"

    const session = await createCustomerPortalSession(
      stripeCustomerId,
      `${baseUrl}/admin/hosting`
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Portal error:", error)
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    )
  }
}
