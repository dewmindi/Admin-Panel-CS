import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { orderSchema } from "@/lib/schemas"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const orders = await db
      .collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(
      orders.map((o) => ({
        ...o,
        _id: o._id.toString(),
      }))
    )
  } catch (error) {
    console.error("Orders GET error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = orderSchema.parse(body)

    const { db } = await connectToDatabase()
    const result = await db.collection("orders").insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Orders POST error:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...rest } = body

    if (!id) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 })
    }

    const data = orderSchema.parse(rest)

    const { db } = await connectToDatabase()
    await db.collection("orders").updateOne(
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
    console.error("Orders PUT error:", error)
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection("orders").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Orders DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    )
  }
}
