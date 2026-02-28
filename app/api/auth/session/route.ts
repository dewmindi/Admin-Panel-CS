import { NextResponse } from "next/server"
import { getSession, getOrCreateAdmin } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const admin = await getOrCreateAdmin(session.email)

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.email,
        name: admin?.name || session.email.split("@")[0],
        role: admin?.role || "admin",
      },
    })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
