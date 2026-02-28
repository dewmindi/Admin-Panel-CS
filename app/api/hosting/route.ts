import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { hostingCustomerSchema } from "@/lib/schemas"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const customers = await db
      .collection("hosting_customers")
      .find({})
      .sort({ renewalDate: 1 })
      .toArray()

    return NextResponse.json(
      customers.map((c) => ({
        ...c,
        _id: c._id.toString(),
      }))
    )
  } catch (error) {
    console.error("Hosting GET error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = hostingCustomerSchema.parse(body)

    const { db } = await connectToDatabase()
    const result = await db.collection("hosting_customers").insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Hosting POST error:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: "Customer ID required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection("hosting_customers").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...data,
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Hosting PUT error:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Customer ID required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection("hosting_customers").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Hosting DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
