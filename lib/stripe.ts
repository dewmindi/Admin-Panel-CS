import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
})

export async function createHostingProduct(name: string, description: string) {
  return stripe.products.create({ name, description })
}

export async function createHostingPrice(
  productId: string,
  amount: number,
  interval: "month" | "year"
) {
  return stripe.prices.create({
    product: productId,
    unit_amount: Math.round(amount * 100),
    currency: "aud",
    recurring: { interval },
  })
}

export async function createCheckoutSession(
  priceId: string,
  customerEmail: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
) {
  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: customerEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  })
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId)
}
