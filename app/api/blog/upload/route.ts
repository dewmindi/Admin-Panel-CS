import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      )
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const timestamp = Date.now()
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 40)
    const filename = `${safeName}-${timestamp}.${ext}`

    const uploadDir = join(process.cwd(), "public", "uploads", "blog")
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)

    return NextResponse.json({ url: `/uploads/blog/${filename}` })
  } catch (error) {
    console.error("Blog upload error:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
