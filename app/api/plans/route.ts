import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { hostingPlanSchema } from "@/lib/schemas"
import { ObjectId } from "mongodb"
import { createHostingProduct, createHostingPrice } from "@/lib/stripe"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const plans = await db
      .collection("hosting_plans")
      .find({})
      .sort({ monthlyPrice: 1 })
      .toArray()

    return NextResponse.json(
      plans.map((p) => ({ ...p, _id: p._id.toString() }))
    )
  } catch (error) {
    console.error("Plans GET error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = hostingPlanSchema.parse(body)
    const { db } = await connectToDatabase()

    let stripeProductId = data.stripeProductId
    let stripePriceIdMonthly = data.stripePriceIdMonthly
    let stripePriceIdYearly = data.stripePriceIdYearly

    // Create Stripe product and prices if not provided and Stripe key is set
    if (!stripeProductId && process.env.STRIPE_SECRET_KEY) {
      try {
        const product = await createHostingProduct(data.name, data.description)
        stripeProductId = product.id

        if (data.monthlyPrice > 0) {
          const monthlyPrice = await createHostingPrice(product.id, data.monthlyPrice, "month")
          stripePriceIdMonthly = monthlyPrice.id
        }

        if (data.yearlyPrice > 0) {
          const yearlyPrice = await createHostingPrice(product.id, data.yearlyPrice, "year")
          stripePriceIdYearly = yearlyPrice.id
        }
      } catch (stripeError) {
        console.error("Stripe product creation failed:", stripeError)
        // Continue without Stripe IDs — user can add them manually
      }
    }

    const result = await db.collection("hosting_plans").insertOne({
      ...data,
      stripeProductId,
      stripePriceIdMonthly,
      stripePriceIdYearly,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Plans POST error:", error)
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection("hosting_plans").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Plans PUT error:", error)
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection("hosting_plans").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Plans DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 })
  }
}
