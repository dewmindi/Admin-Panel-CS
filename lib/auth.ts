import { cookies } from "next/headers"
import { connectToDatabase } from "./mongodb"
import crypto from "crypto"

const SESSION_COOKIE = "admin_session"
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 1 day
const REMEMBER_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function createOTP(email: string): Promise<string> {
  const { db } = await connectToDatabase()
  const otp = generateOTP()
  const hashedOtp = hashToken(otp)

  await db.collection("otps").deleteMany({ email })
  await db.collection("otps").insertOne({
    email,
    otp: hashedOtp,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  })

  return otp
}

export async function verifyOTP(
  otp: string
): Promise<boolean> {
  const { db } = await connectToDatabase()
  const hashedOtp = hashToken(otp)

  const record = await db.collection("otps").findOne({
    otp: hashedOtp,
    expiresAt: { $gt: new Date() },
  })

  if (record) {
    await db.collection("otps").deleteMany({ otp: hashedOtp })
    return true
  }

  return false
}

export async function createSession(
  email: string,
  rememberMe: boolean = false
): Promise<string> {
  const { db } = await connectToDatabase()
  const sessionToken = crypto.randomBytes(32).toString("hex")
  const hashedToken = hashToken(sessionToken)
  const duration = rememberMe ? REMEMBER_DURATION : SESSION_DURATION

  await db.collection("sessions").insertOne({
    email,
    token: hashedToken,
    rememberMe,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + duration),
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: duration / 1000,
    path: "/",
  })

  return sessionToken
}

export async function getSession(): Promise<{
  email: string
  rememberMe: boolean
} | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionToken) return null

  const { db } = await connectToDatabase()
  const hashedToken = hashToken(sessionToken)

  const session = await db.collection("sessions").findOne({
    token: hashedToken,
    expiresAt: { $gt: new Date() },
  })

  if (!session) return null

  return {
    email: session.email,
    rememberMe: session.rememberMe,
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  if (sessionToken) {
    const { db } = await connectToDatabase()
    const hashedToken = hashToken(sessionToken)
    await db.collection("sessions").deleteOne({ token: hashedToken })
  }

  cookieStore.delete(SESSION_COOKIE)
}

export async function getOrCreateAdmin(email: string) {
  const { db } = await connectToDatabase()

  let admin = await db.collection("admins").findOne({ email })

  if (!admin) {
    const result = await db.collection("admins").insertOne({
      email,
      name: email.split("@")[0],
      role: "admin",
      createdAt: new Date(),
    })
    admin = await db
      .collection("admins")
      .findOne({ _id: result.insertedId })
  }

  return admin
}
