"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Pencil,
  Trash2,
  ArrowUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { OrderFormDialog } from "@/components/orders/order-form-dialog"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  "in-progress": "secondary",
  completed: "default",
  cancelled: "destructive",
}

const serviceLabels: Record<string, string> = {
  "web-design": "Web Design",
  "graphic-design": "Graphic Design",
  branding: "Branding",
  seo: "SEO",
  "social-media": "Social Media",
  other: "Other",
}

const ITEMS_PER_PAGE = 10

export default function OrdersPage() {
  const { data: orders, isLoading, mutate } = useSWR("/api/orders", fetcher)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState("createdAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editOrder, setEditOrder] = useState<Record<string, unknown> | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return []
    let result = [...orders]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o: Record<string, unknown>) =>
          (o.customerName as string)?.toLowerCase().includes(q) ||
          (o.customerEmail as string)?.toLowerCase().includes(q) ||
          (o.service as string)?.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((o: Record<string, unknown>) => o.fulfillmentStatus === statusFilter)
    }

    result.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal
      }
      return sortDir === "asc"
        ? String(aVal || "").localeCompare(String(bVal || ""))
        : String(bVal || "").localeCompare(String(aVal || ""))
    })

    return result
  }, [orders, search, statusFilter, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await fetch(`/api/orders?id=${deleteId}`, { method: "DELETE" })
      toast.success("Order deleted")
      mutate()
    } catch {
      toast.error("Failed to delete order")
    } finally {
      setDeleteId(null)
    }
  }

  async function handleNotify(order: Record<string, unknown>) {
    try {
      const res = await fetch("/api/orders/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          orderId: order._id,
          fulfillmentStatus: order.fulfillmentStatus,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Notification sent to ${order.customerEmail}`)
    } catch {
      toast.error("Failed to send notification")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track all customer orders
          </p>
        </div>
        <Button onClick={() => { setEditOrder(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => toggleSort("customerName")}>
                      Customer <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => toggleSort("amount")}>
                      Amount <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fulfillment</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => toggleSort("createdAt")}>
                      Date <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((order: Record<string, unknown>) => (
                    <TableRow key={order._id as string}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{order.customerName as string}</span>
                          <span className="text-xs text-muted-foreground">{order.customerEmail as string}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {serviceLabels[order.service as string] || (order.service as string)}
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums">
                        ${(order.amount as number)?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[order.paymentStatus as string] || "outline"} className="text-xs capitalize">
                          {(order.status as string)?.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[order.fulfillmentStatus as string] || "outline"} className="text-xs capitalize">
                          {(order.fulfillmentStatus as string)?.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt as string).toLocaleDateString("en-AU") : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditOrder(order); setFormOpen(true) }}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNotify(order)}>
                              <Mail className="mr-2 h-4 w-4" /> Send Notification
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(order._id as string)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} order{filtered.length !== 1 ? "s" : ""} total
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <OrderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        order={editOrder}
        onSuccess={() => mutate()}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The order will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
