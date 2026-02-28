"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, X } from "lucide-react"
import { hostingPlanSchema, type HostingPlanInput } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface Plan {
  _id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  stripeProductId?: string
  stripePriceIdMonthly?: string
  stripePriceIdYearly?: string
}

interface PlanFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: Plan | null
  onSuccess: () => void
}

export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: PlanFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [featureInput, setFeatureInput] = useState("")
  const isEditing = !!plan

  const form = useForm<HostingPlanInput>({
    resolver: zodResolver(hostingPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [],
      stripeProductId: "",
      stripePriceIdMonthly: "",
      stripePriceIdYearly: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: plan?.name || "",
        description: plan?.description || "",
        monthlyPrice: plan?.monthlyPrice || 0,
        yearlyPrice: plan?.yearlyPrice || 0,
        features: plan?.features || [],
        stripeProductId: plan?.stripeProductId || "",
        stripePriceIdMonthly: plan?.stripePriceIdMonthly || "",
        stripePriceIdYearly: plan?.stripePriceIdYearly || "",
      })
      setFeatureInput("")
    }
  }, [open, plan, form])

  const features = form.watch("features")

  function addFeature() {
    const trimmed = featureInput.trim()
    if (trimmed && !features.includes(trimmed)) {
      form.setValue("features", [...features, trimmed])
      setFeatureInput("")
    }
  }

  function removeFeature(index: number) {
    form.setValue(
      "features",
      features.filter((_, i) => i !== index)
    )
  }

  async function onSubmit(data: HostingPlanInput) {
    setIsLoading(true)
    try {
      const method = isEditing ? "PUT" : "POST"
      const body = isEditing ? { id: plan?._id, ...data } : data

      const res = await fetch("/api/plans", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error("Request failed")

      toast.success(isEditing ? "Plan updated" : "Plan created")
      onSuccess()
      onOpenChange(false)
      form.reset()
    } catch {
      toast.error("Failed to save plan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Plan" : "Create Hosting Plan"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the hosting plan details."
              : "Create a new hosting plan. Stripe product and prices will be auto-created if a Stripe key is configured."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Business Plan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Perfect for growing businesses..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="monthlyPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price (AUD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="29.99"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yearlyPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yearly Price (AUD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="299.99"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <FormLabel>Features</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Add a feature..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addFeature()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFeature}
                >
                  Add
                </Button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {features.map((feat, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {feat}
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {feat}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="stripeProductId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Product ID</FormLabel>
                    <FormControl>
                      <Input placeholder="prod_..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stripePriceIdMonthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price ID</FormLabel>
                    <FormControl>
                      <Input placeholder="price_..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stripePriceIdYearly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yearly Price ID</FormLabel>
                    <FormControl>
                      <Input placeholder="price_..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update Plan"
                ) : (
                  "Create Plan"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
