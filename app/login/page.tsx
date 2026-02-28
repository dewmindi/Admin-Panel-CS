"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Mail, ShieldCheck } from "lucide-react"
import { loginSchema, otpSchema, type LoginInput, type OTPInput } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { OtpInput } from "@/components/ui/otp-input"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const emailForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" },
  })

  const otpForm = useForm<OTPInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "", rememberMe: false },
  })

  async function onSendOTP(data: LoginInput) {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()

      if (result.skipOtp) {
        toast.success("Welcome back! Session restored.")
        router.push("/admin")
        return
      }

      if (!res.ok) {
        toast.error(result.error || "Failed to send code")
        return
      }

      setEmail(data.email)
      otpForm.reset({ rememberMe: false })
      setStep("otp")
      toast.success("Verification code sent to your email")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  // async function onVerifyOTP(data: OTPInput) {

  //   console.log(data)
  //   console.log("data")
  //   setIsLoading(true)
  //   try {
  //     const res = await fetch("/api/auth/verify-otp", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ ...data, email }),
  //     })
  //     const result = await res.json()

  //     if (!res.ok) {
  //       toast.error(result.error || "Invalid code")
  //       return
  //     }

  //     toast.success("Signed in successfully")
  //     router.refresh()
  //     router.push("/admin")
  //   } catch {
  //     toast.error("Verification failed")
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  async function onVerifyOTP(data: OTPInput) {
        console.log(data)
    console.log("data")
  setIsLoading(true)
  try {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, email }), // email comes from state
    })
    const result = await res.json()

    if (!res.ok) {
      toast.error(result.error || "Invalid code")
      return
    }

    toast.success("Signed in successfully")
    router.push("/admin")
  } catch {
    toast.error("Verification failed")
  } finally {
    setIsLoading(false)
  }
}


  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
            <ShieldCheck className="h-6 w-6 text-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">CS Graphic Meta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Admin Panel</p>
        </div>

        {step === "email" ? (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Sign in</CardTitle>
              <CardDescription>Enter your admin email to receive a verification code.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onSendOTP)} className="flex flex-col gap-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="admin@csgraphicmeta.com.au" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Enter verification code</CardTitle>
              <CardDescription>
                {"We sent a 6-digit code to "}
                <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onVerifyOTP, (errors) => console.log(errors))} className="flex flex-col gap-4">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => {
                      console.log("OTP Value:", field.value)   // 👈 ADD HERE

                      return (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <OtpInput
                              length={6}
                              onChange={(val) => {
                                otpForm.setValue("otp", val, { shouldValidate: true })
                              }}
                            />



                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />



                  <FormField
                    control={otpForm.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-sm font-normal text-muted-foreground !mt-0">
                          Keep me signed in for 7 days
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => setStep("email")}
                  >
                    Use a different email
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
