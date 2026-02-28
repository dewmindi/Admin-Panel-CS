import { NextResponse } from "next/server"
import { otpSchema } from "@/lib/schemas"
import { verifyOTP, createSession } from "@/lib/auth"

// export async function POST(request: Request) {
//   try {
//     const body = await request.json()
//     const { otp, rememberMe } = otpSchema.parse(body)
// const { email } = body

// if (!email) {
//   return NextResponse.json({ error: "Email missing" }, { status: 400 })
// }


//     const isValid = await verifyOTP(otp)

//     if (!isValid) {
//       return NextResponse.json(
//         { error: "Invalid or expired verification code" },
//         { status: 401 }
//       )
//     }

//     await createSession(otp, rememberMe)

//     return NextResponse.json({ success: true })
//   } catch (error) {
//     console.error("Verify OTP error:", error)
//     return NextResponse.json(
//       { error: "Verification failed" },
//       { status: 500 }
//     )
//   }
// }

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { otp, rememberMe } = otpSchema.parse(body)
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email missing" }, { status: 400 })
    }

    const isValid = await verifyOTP( otp)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 401 }
      )
    }

    await createSession(email, rememberMe)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    )
  }
}
