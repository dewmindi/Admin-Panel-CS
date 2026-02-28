"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { hostingCustomerSchema, type HostingCustomerInput } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface HostingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Record<string, unknown> | null
  onSuccess: () => void
}

const plans = [
  { value: "starter", label: "Starter" },
  { value: "business", label: "Business" },
  { value: "premium", label: "Premium" },
  { value: "enterprise", label: "Enterprise" },
]

const statuses = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
]

export function HostingFormDialog({ open, onOpenChange, customer, onSuccess }: HostingFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!customer

  const form = useForm<HostingCustomerInput>({
    resolver: zodResolver(hostingCustomerSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      domain: "",
      plan: "starter",
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      renewalDate: "",
      amount: 0,
      billingCycle: "yearly",
      stripeCustomerId: "",
      stripeSubscriptionId: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        customerName: (customer?.customerName as string) || "",
        customerEmail: (customer?.customerEmail as string) || "",
        domain: (customer?.domain as string) || "",
        plan: (customer?.plan as HostingCustomerInput["plan"]) || "starter",
        status: (customer?.status as HostingCustomerInput["status"]) || "active",
        startDate: (customer?.startDate as string) || new Date().toISOString().split("T")[0],
        renewalDate: (customer?.renewalDate as string) || "",
        amount: (customer?.amount as number) || 0,
        billingCycle: (customer?.billingCycle as HostingCustomerInput["billingCycle"]) || "yearly",
        stripeCustomerId: (customer?.stripeCustomerId as string) || "",
        stripeSubscriptionId: (customer?.stripeSubscriptionId as string) || "",
        notes: (customer?.notes as string) || "",
      })
    }
  }, [open, customer, form])

  async function onSubmit(data: HostingCustomerInput) {
    setIsLoading(true)
    try {
      const method = isEditing ? "PUT" : "POST"
      const body = isEditing ? { id: customer?._id, ...data } : data

      const res = await fetch("/api/hosting", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error("Request failed")

      toast.success(isEditing ? "Customer updated" : "Customer added")
      onSuccess()
      onOpenChange(false)
      form.reset()
    } catch {
      toast.error("Failed to save customer")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Customer" : "Add Hosting Customer"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the hosting customer details." : "Add a new hosting customer with their plan and renewal details."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl><Input placeholder="Company Pty Ltd" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="client@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormControl><Input placeholder="example.com.au" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {plans.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="renewalDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewal Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="stripeCustomerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Customer ID</FormLabel>
                    <FormControl><Input placeholder="cus_..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stripeSubscriptionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Subscription ID</FormLabel>
                    <FormControl><Input placeholder="sub_..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="Internal notes..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? "Update Customer" : "Add Customer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
