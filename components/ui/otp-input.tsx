"use client"

import React, { useState, useRef, ChangeEvent, KeyboardEvent } from "react"
import { cn } from "@/lib/utils"

interface OtpInputProps {
  length?: number
  onChange: (otp: string) => void
  className?: string
  inputClassName?: string
}

export const OtpInput = React.forwardRef<HTMLDivElement, OtpInputProps>(
  ({ length = 6, onChange, className, inputClassName }, ref) => {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(""))
    const inputRefs = useRef<HTMLInputElement[]>([])

    const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
      const val = e.target.value
      if (/^[0-9]$/.test(val) || val === "") {
        const newOtp = [...otp]
        newOtp[index] = val
        setOtp(newOtp)

        onChange(newOtp.join(""))

        if (val && index < length - 1) {
          inputRefs.current[index + 1]?.focus()
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }

    return (
      <div ref={ref} className={cn("flex justify-center gap-2", className)}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el!)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "h-12 w-12 rounded-md border border-input bg-transparent text-center text-2xl font-medium text-foreground transition-all focus:border-primary focus:ring-1 focus:ring-primary",
              inputClassName
            )}
          />
        ))}
      </div>
    )
  }
)

OtpInput.displayName = "OtpInput"
