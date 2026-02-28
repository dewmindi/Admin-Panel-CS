"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Send,
  Loader2,
  FileText,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"

const invoiceSchema = z.object({
  to: z.string().email("Valid email required"),
  customerName: z.string().min(1, "Customer name required"),
  invoiceNumber: z.string().min(1, "Invoice number required"),
})

const orderStatusSchema = z.object({
  to: z.string().email("Valid email required"),
  customerName: z.string().min(1, "Customer name required"),
  orderId: z.string().min(1, "Order ID required"),
  status: z.enum(["pending", "in-progress", "completed", "cancelled"]),
  message: z.string().optional(),
})

const renewalSchema = z.object({
  to: z.string().email("Valid email required"),
  customerName: z.string().min(1, "Customer name required"),
  domain: z.string().min(1, "Domain required"),
  plan: z.string().min(1, "Plan required"),
  renewalDate: z.string().min(1, "Renewal date required"),
})

interface LineItem {
  description: string
  amount: number
}

function InvoiceTab() {
  const [sending, setSending] = useState(false)
  const [items, setItems] = useState<LineItem[]>([
    { description: "", amount: 0 },
  ])

  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      to: "",
      customerName: "",
      invoiceNumber: `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    },
  })

  function addItem() {
    setItems([...items, { description: "", amount: 0 }])
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...items]
    if (field === "amount") {
      updated[index][field] = typeof value === "string" ? Number.parseFloat(value) || 0 : value
    } else {
      updated[index][field] = value as string
    }
    setItems(updated)
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0)

  async function onSubmit(formData: z.infer<typeof invoiceSchema>) {
    if (items.every((i) => !i.description.trim())) {
      toast.error("Add at least one line item")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "invoice",
          to: formData.to,
          data: {
            customerName: formData.customerName,
            invoiceNumber: formData.invoiceNumber,
            items: items.filter((i) => i.description.trim()),
            total,
          },
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Invoice sent to ${formData.to}`)
      form.reset({
        to: "",
        customerName: "",
        invoiceNumber: `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      })
      setItems([{ description: "", amount: 0 }])
    } catch {
      toast.error("Failed to send invoice")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4" />
          Send Invoice
        </CardTitle>
        <CardDescription>
          Generate and send an invoice email to a customer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <FormControl>
                      <Input placeholder="client@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input placeholder="INV-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={item.amount || ""}
                    onChange={(e) => updateItem(i, "amount", e.target.value)}
                    className="w-28"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Remove item</span>
                  </Button>
                </div>
              ))}
              <div className="flex justify-end pt-1">
                <span className="text-sm font-medium">
                  Total: <span className="tabular-nums">${total.toFixed(2)}</span>
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invoice
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function QuoteTab() {
  const [sending, setSending] = useState(false)
  const [items, setItems] = useState<LineItem[]>([
    { description: "", amount: 0 },
  ])

  const form = useForm({
    resolver: zodResolver(
      invoiceSchema.extend({
        invoiceNumber: z.string().min(1, "Quote number required"),
      })
    ),
    defaultValues: {
      to: "",
      customerName: "",
      invoiceNumber: `QT-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    },
  })

  function addItem() {
    setItems([...items, { description: "", amount: 0 }])
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...items]
    if (field === "amount") {
      updated[index][field] = typeof value === "string" ? Number.parseFloat(value) || 0 : value
    } else {
      updated[index][field] = value as string
    }
    setItems(updated)
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0)

  async function onSubmit(formData: z.infer<typeof invoiceSchema>) {
    if (items.every((i) => !i.description.trim())) {
      toast.error("Add at least one line item")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quote",
          to: formData.to,
          data: {
            customerName: formData.customerName,
            quoteNumber: formData.invoiceNumber,
            items: items.filter((i) => i.description.trim()),
            total,
          },
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Quote sent to ${formData.to}`)
      form.reset({
        to: "",
        customerName: "",
        invoiceNumber: `QT-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      })
      setItems([{ description: "", amount: 0 }])
    } catch {
      toast.error("Failed to send quote")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Send Quote
        </CardTitle>
        <CardDescription>
          Generate and send a quote email to a potential customer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <FormControl>
                      <Input placeholder="client@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quote Number</FormLabel>
                    <FormControl>
                      <Input placeholder="QT-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={item.amount || ""}
                    onChange={(e) => updateItem(i, "amount", e.target.value)}
                    className="w-28"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Remove item</span>
                  </Button>
                </div>
              ))}
              <div className="flex justify-end pt-1">
                <span className="text-sm font-medium">
                  Total: <span className="tabular-nums">${total.toFixed(2)}</span>
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Quote
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function OrderStatusTab() {
  const [sending, setSending] = useState(false)

  const form = useForm({
    resolver: zodResolver(orderStatusSchema),
    defaultValues: {
      to: "",
      customerName: "",
      orderId: "",
      status: "pending" as const,
      message: "",
    },
  })

  async function onSubmit(data: z.infer<typeof orderStatusSchema>) {
    setSending(true)
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order-status",
          to: data.to,
          data: {
            customerName: data.customerName,
            orderId: data.orderId,
            status: data.status,
            message: data.message,
          },
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Status update sent to ${data.to}`)
      form.reset()
    } catch {
      toast.error("Failed to send notification")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="h-4 w-4" />
          Order Status Update
        </CardTitle>
        <CardDescription>
          Send an order status notification to a customer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <FormControl>
                      <Input placeholder="client@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order ID</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Additional Message{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Any additional message for the customer..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Update
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function RenewalTab() {
  const [sending, setSending] = useState(false)

  const form = useForm({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      to: "",
      customerName: "",
      domain: "",
      plan: "",
      renewalDate: "",
    },
  })

  async function onSubmit(data: z.infer<typeof renewalSchema>) {
    setSending(true)
    try {
      const formattedDate = new Date(data.renewalDate).toLocaleDateString(
        "en-AU",
        { day: "numeric", month: "long", year: "numeric" }
      )

      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hosting-renewal",
          to: data.to,
          data: {
            customerName: data.customerName,
            domain: data.domain,
            renewalDate: formattedDate,
            plan: data.plan,
          },
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Renewal reminder sent to ${data.to}`)
      form.reset()
    } catch {
      toast.error("Failed to send reminder")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="h-4 w-4" />
          Hosting Renewal Reminder
        </CardTitle>
        <CardDescription>
          Send a hosting renewal reminder to a customer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <FormControl>
                      <Input placeholder="client@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="example.com.au" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <FormControl>
                      <Input placeholder="Business" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Reminder
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default function EmailsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Email Templates
        </h1>
        <p className="text-sm text-muted-foreground">
          Send invoices, quotes, order updates, and hosting reminders
        </p>
      </div>

      <Tabs defaultValue="invoice" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="quote">Quote</TabsTrigger>
          <TabsTrigger value="order-status">Order Status</TabsTrigger>
          <TabsTrigger value="renewal">Renewal</TabsTrigger>
        </TabsList>

        <TabsContent value="invoice" className="mt-4">
          <InvoiceTab />
        </TabsContent>
        <TabsContent value="quote" className="mt-4">
          <QuoteTab />
        </TabsContent>
        <TabsContent value="order-status" className="mt-4">
          <OrderStatusTab />
        </TabsContent>
        <TabsContent value="renewal" className="mt-4">
          <RenewalTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
