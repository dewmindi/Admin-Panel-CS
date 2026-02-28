import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Available pages on the website
const DEFAULT_PAGES = [
  { slug: "home", title: "Home Page", description: "Main landing page" },
  { slug: "about", title: "About Us", description: "Company information page" },
  { slug: "services", title: "Services", description: "Services offered" },
  { slug: "portfolio", title: "Portfolio", description: "Work showcase" },
  { slug: "contact", title: "Contact", description: "Contact information" },
  { slug: "web-design", title: "Web Design", description: "Web design service page" },
  { slug: "graphic-design", title: "Graphic Design", description: "Graphic design service page" },
  { slug: "seo", title: "SEO Services", description: "SEO service page" },
  { slug: "branding", title: "Branding", description: "Branding service page" },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    const { db } = await connectToDatabase()

    if (slug) {
      const page = await db.collection("content_pages").findOne({ slug })
      if (!page) {
        const defaultPage = DEFAULT_PAGES.find((p) => p.slug === slug)
        return NextResponse.json({
          slug,
          title: defaultPage?.title || slug,
          sections: [],
          status: "draft",
          metaTitle: "",
          metaDescription: "",
        })
      }
      return NextResponse.json({ ...page, _id: page._id.toString() })
    }

    const pages = await db.collection("content_pages").find({}).toArray()

    // Merge with default pages
    const merged = DEFAULT_PAGES.map((dp) => {
      const existing = pages.find((p) => p.slug === dp.slug)
      if (existing) {
        return {
          ...dp,
          ...existing,
          _id: existing._id.toString(),
          hasContent: true,
          sectionCount: existing.sections?.length || 0,
        }
      }
      return { ...dp, hasContent: false, sectionCount: 0, status: "draft" }
    })

    return NextResponse.json(merged)
  } catch (error) {
    console.error("Content GET error:", error)
    return NextResponse.json(DEFAULT_PAGES.map((p) => ({ ...p, hasContent: false, sectionCount: 0, status: "draft" })))
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { db } = await connectToDatabase()

    const existing = await db.collection("content_pages").findOne({ slug: body.slug })

    if (existing) {
      await db.collection("content_pages").updateOne(
        { slug: body.slug },
        {
          $set: {
            title: body.title,
            sections: body.sections,
            status: body.status,
            metaTitle: body.metaTitle,
            metaDescription: body.metaDescription,
            updatedAt: new Date(),
          },
        }
      )
    } else {
      await db.collection("content_pages").insertOne({
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Content POST error:", error)
    return NextResponse.json({ error: "Failed to save content" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection("content_pages").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Content DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
