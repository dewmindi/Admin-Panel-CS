import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { connectToDatabase } from "@/lib/mongodb"
import { sendEmail, hostingRenewalEmailTemplate } from "@/lib/email"
import type Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing stripe signature or webhook secret" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    )
  }

  const { db } = await connectToDatabase()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const hostingCustomerId = session.metadata?.hostingCustomerId

        if (hostingCustomerId && session.customer) {
          await db.collection("hosting_customers").updateOne(
            { _id: hostingCustomerId },
            {
              $set: {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                status: "active",
                updatedAt: new Date(),
              },
            }
          )
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer
        const status = subscription.status === "active" ? "active" : "suspended"

        await db.collection("hosting_customers").updateOne(
          { stripeCustomerId: customerId },
          {
            $set: {
              status,
              stripeSubscriptionId: subscription.id,
              updatedAt: new Date(),
            },
          }
        )
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer

        await db.collection("hosting_customers").updateOne(
          { stripeCustomerId: customerId },
          {
            $set: {
              status: "cancelled",
              updatedAt: new Date(),
            },
          }
        )
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer

        // Update renewal date if it's a subscription payment
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          const currentPeriodEnd = new Date(
            sub.current_period_end * 1000
          ).toISOString()

          await db.collection("hosting_customers").updateOne(
            { stripeCustomerId: customerId },
            {
              $set: {
                renewalDate: currentPeriodEnd.split("T")[0],
                status: "active",
                updatedAt: new Date(),
              },
            }
          )
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer

        const customer = await db
          .collection("hosting_customers")
          .findOne({ stripeCustomerId: customerId })

        if (customer) {
          await db.collection("hosting_customers").updateOne(
            { stripeCustomerId: customerId },
            {
              $set: {
                status: "suspended",
                updatedAt: new Date(),
              },
            }
          )

          // Send renewal/payment failure notification
          if (customer.customerEmail) {
            await sendEmail({
              to: customer.customerEmail,
              subject: `Payment Failed - ${customer.domain}`,
              html: hostingRenewalEmailTemplate(
                customer.customerName,
                customer.domain,
                "Payment failed - please update your payment method",
                customer.plan
              ),
            })
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
