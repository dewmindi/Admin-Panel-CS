import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
  rememberMe: z.boolean().default(false),
})

export const orderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  service: z.enum(["web-design", "graphic-design", "seo", "branding", "social-media", "other"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  amount: z.number().min(0, "Amount must be positive"),
  fulfillmentStatus: z.enum(["pending", "in-progress", "completed", "cancelled"]).default("pending"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

export const hostingCustomerSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  domain: z.string().min(1, "Domain is required"),
  plan: z.enum(["starter", "business", "premium", "enterprise"]),
  status: z.enum(["active", "suspended", "expired", "cancelled"]).default("active"),
  startDate: z.string(),
  renewalDate: z.string(),
  amount: z.number().min(0),
  billingCycle: z.enum(["monthly", "yearly"]).default("yearly"),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  notes: z.string().optional(),
})

export const contentPageSchema = z.object({
  slug: z.string().min(1, "Page slug is required"),
  title: z.string().min(1, "Title is required"),
  sections: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["hero", "text", "image", "gallery", "cta", "features", "testimonials"]),
      title: z.string().optional(),
      content: z.string().optional(),
      imageUrl: z.string().optional(),
      images: z.array(z.string()).optional(),
      order: z.number(),
    })
  ),
  status: z.enum(["draft", "published"]).default("draft"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

export const hostingPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().min(1, "Description is required"),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  features: z.array(z.string()),
  stripeProductId: z.string().optional(),
  stripePriceIdMonthly: z.string().optional(),
  stripePriceIdYearly: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type OTPInput = z.infer<typeof otpSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type HostingCustomerInput = z.infer<typeof hostingCustomerSchema>
export type ContentPageInput = z.infer<typeof contentPageSchema>
export type HostingPlanInput = z.infer<typeof hostingPlanSchema>
