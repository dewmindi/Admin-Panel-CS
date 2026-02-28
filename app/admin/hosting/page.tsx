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
  Calendar,
  Globe,
  CreditCard,
  ExternalLink,
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
import { HostingFormDialog } from "@/components/hosting/hosting-form-dialog"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  suspended: "secondary",
  expired: "destructive",
  cancelled: "outline",
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

const ITEMS_PER_PAGE = 10

export default function HostingPage() {
  const { data: customers, isLoading, mutate } = useSWR("/api/hosting", fetcher)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState("renewalDate")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Record<string, unknown> | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!customers || !Array.isArray(customers)) return []
    let result = [...customers]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c: Record<string, unknown>) =>
          (c.customerName as string)?.toLowerCase().includes(q) ||
          (c.domain as string)?.toLowerCase().includes(q) ||
          (c.customerEmail as string)?.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((c: Record<string, unknown>) => c.status === statusFilter)
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
  }, [customers, search, statusFilter, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await fetch(`/api/hosting?id=${deleteId}`, { method: "DELETE" })
      toast.success("Customer removed")
      mutate()
    } catch {
      toast.error("Failed to delete customer")
    } finally {
      setDeleteId(null)
    }
  }

  async function handleSendRenewal(customer: Record<string, unknown>) {
    try {
      const res = await fetch("/api/hosting/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer.customerName,
          customerEmail: customer.customerEmail,
          domain: customer.domain,
          renewalDate: customer.renewalDate,
          plan: customer.plan,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Renewal reminder sent to ${customer.customerEmail}`)
    } catch {
      toast.error("Failed to send reminder")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Hosting Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage hosting customers, plans, and renewal reminders
          </p>
        </div>
        <Button onClick={() => { setEditCustomer(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers or domains..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
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
                  <TableHead>Domain</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => toggleSort("amount")}>
                      Amount <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => toggleSort("renewalDate")}>
                      Renewal <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No hosting customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((customer: Record<string, unknown>) => {
                    const days = customer.renewalDate ? daysUntil(customer.renewalDate as string) : null
                    const isUrgent = days !== null && days <= 7
                    const isSoon = days !== null && days <= 30

                    return (
                      <TableRow key={customer._id as string}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{customer.customerName as string}</span>
                            <span className="text-xs text-muted-foreground">{customer.customerEmail as string}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{customer.domain as string}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {customer.plan as string}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[customer.status as string] || "outline"} className="text-xs capitalize">
                            {customer.status as string}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium tabular-nums">
                          ${(customer.amount as number)?.toLocaleString()}/{(customer.billingCycle as string) === "monthly" ? "mo" : "yr"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className={`text-xs tabular-nums ${isUrgent ? "text-destructive font-medium" : isSoon ? "text-warning font-medium" : "text-muted-foreground"}`}>
                              {customer.renewalDate ? new Date(customer.renewalDate as string).toLocaleDateString("en-AU") : "-"}
                            </span>
                            {days !== null && days <= 30 && customer.status === "active" && (
                              <Badge variant="outline" className="ml-1 text-xs">
                                {days <= 0 ? "Overdue" : `${days}d`}
                              </Badge>
                            )}
                          </div>
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
                              <DropdownMenuItem onClick={() => { setEditCustomer(customer); setFormOpen(true) }}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendRenewal(customer)}>
                                <Mail className="mr-2 h-4 w-4" /> Send Renewal Reminder
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(customer._id as string)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} customer{filtered.length !== 1 ? "s" : ""} total
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

      <HostingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editCustomer}
        onSuccess={() => mutate()}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hosting Customer</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The customer record will be permanently removed.
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
