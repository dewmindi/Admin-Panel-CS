import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { deleteFromCloudinary } from "@/lib/cloudinary"
import { revalidate } from "@/lib/revalidate"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const items = await db
      .collection("portfolio_items")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(
      items.map((item) => ({
        id: item._id.toString(),
        service: item.service,
        title: item.title,
        link: item.weblink,
        description: item.description,
        imageUrl: item.imageUrl,
        createdAt: item.createdAt,
      }))
    )
  } catch (err) {
    console.error("[portfolio] GET error:", err)
    return NextResponse.json({ error: "Failed to fetch portfolio items." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid item ID." }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const item = await db.collection("portfolio_items").findOne({ _id: new ObjectId(id) })

    if (!item) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 })
    }

    await db.collection("portfolio_items").deleteOne({ _id: new ObjectId(id) })

    if (item.publicId) {
      await deleteFromCloudinary(item.publicId)
    }

    await revalidate()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[portfolio] DELETE error:", err)
    return NextResponse.json({ error: "Failed to delete item." }, { status: 500 })
  }
}
