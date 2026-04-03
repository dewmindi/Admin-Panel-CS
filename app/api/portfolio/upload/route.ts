import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { revalidate } from "@/lib/revalidate"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const files = formData.getAll("file")
    if (files.length === 0) {
      return NextResponse.json({ error: "No image selected." }, { status: 400 })
    }
    if (files.length > 1) {
      return NextResponse.json(
        { error: "Please select only one image at a time." },
        { status: 400 }
      )
    }

    const file = files[0]
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Invalid file." }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and GIF images are allowed." },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 5MB." },
        { status: 400 }
      )
    }

    const service = formData.get("service")?.toString().trim()
    if (!service) {
      return NextResponse.json({ error: "Service type is required." }, { status: 400 })
    }

    const title = formData.get("title")?.toString().trim() || ""
    const description = formData.get("description")?.toString().trim() || ""
    const weblink = formData.get("weblink")?.toString().trim() || ""

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { secure_url, public_id } = await uploadToCloudinary(buffer, file.name)

    const { db } = await connectToDatabase()
    const result = await db.collection("portfolio_items").insertOne({
      service,
      title,
      description,
      weblink,
      imageUrl: secure_url,
      publicId: public_id,
      createdAt: new Date(),
    })

    await revalidate()

    return NextResponse.json({
      success: true,
      item: {
        id: result.insertedId.toString(),
        service,
        title,
        description,
        imageUrl: secure_url,
      },
    })
  } catch (err) {
    console.error("[portfolio/upload] Error:", err)
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 })
  }
}
