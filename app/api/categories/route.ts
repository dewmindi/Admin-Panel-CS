import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const categories = await db
      .collection("categories")
      .find({})
      .sort({ name: 1 })
      .toArray()

    return NextResponse.json(
      categories.map((c) => ({ ...c, _id: c._id.toString() }))
    )
  } catch (error) {
    console.error("Categories GET error:", error)
    return NextResponse.json([])
  }
}
