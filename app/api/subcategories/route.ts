import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const subcategories = await db
      .collection("subcategories")
      .find({})
      .sort({ name: 1 })
      .toArray()

    return NextResponse.json(
      subcategories.map((s) => ({ ...s, _id: s._id.toString() }))
    )
  } catch (error) {
    console.error("Subcategories GET error:", error)
    return NextResponse.json([])
  }
}
