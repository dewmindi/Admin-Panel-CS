import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { blogSchema } from "@/lib/schemas"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const posts = await db
      .collection("blog_posts")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(
      posts.map((p) => ({ ...p, _id: p._id.toString() }))
    )
  } catch (error) {
    console.error("Blog GET error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = blogSchema.parse(body)
    const { db } = await connectToDatabase()

    // Check for slug uniqueness
    const existing = await db.collection("blog_posts").findOne({ slug: data.slug })
    if (existing) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 })
    }

    const result = await db.collection("blog_posts").insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id: result.insertedId.toString() })
  } catch (error) {
    console.error("Blog POST error:", error)
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Blog post ID required" }, { status: 400 })
    }

    const data = blogSchema.parse(body)
    const { db } = await connectToDatabase()

    // Check slug uniqueness excluding current post
    const existing = await db
      .collection("blog_posts")
      .findOne({ slug: data.slug, _id: { $ne: new ObjectId(id) } })
    if (existing) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 })
    }

    await db.collection("blog_posts").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Blog PUT error:", error)
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Blog post ID required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection("blog_posts").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Blog DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 })
  }
}
