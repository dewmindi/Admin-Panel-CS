import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { packageSchema } from "@/lib/schemas"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const packages = await db
      .collection("packages")
      .find({})
      .sort({ name: 1 })
      .toArray()

    return NextResponse.json(
      packages.map((p) => ({ ...p, _id: p._id.toString() }))
    )
  } catch (error) {
    console.error("Packages GET error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = packageSchema.parse(body)
    const { db } = await connectToDatabase()

    const result = await db.collection("packages").insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Packages POST error:", error)
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const data = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Package ID required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection("packages").updateOne(
      { _id: id as any },
      { $set: { ...data, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Packages PUT error:", error)
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Package ID required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection("packages").deleteOne({ _id: id as any })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Packages DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 })
  }
}
