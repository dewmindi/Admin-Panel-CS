"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { PlanFormDialog } from "@/components/plans/plan-form-dialog"

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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PlansPage() {
  const { data: plans, isLoading, mutate } = useSWR<Plan[]>("/api/plans", fetcher)
  const [formOpen, setFormOpen] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleDelete() {
    if (!deleteId) return
    try {
      await fetch(`/api/plans?id=${deleteId}`, { method: "DELETE" })
      toast.success("Plan deleted")
      mutate()
    } catch {
      toast.error("Failed to delete plan")
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Stripe Plans
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage hosting plans and Stripe subscriptions
          </p>
        </div>
        <Button
          onClick={() => {
            setEditPlan(null)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : plans?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No plans yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create your first hosting plan to start managing subscriptions
            </p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => {
                setEditPlan(null)
                setFormOpen(true)
              }}
            >
              Create Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => (
            <Card key={plan._id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      {plan.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditPlan(plan)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      {plan.stripeProductId && (
                        <DropdownMenuItem asChild>
                          <a
                            href={`https://dashboard.stripe.com/products/${plan.stripeProductId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" /> View in
                            Stripe
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(plan._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-baseline gap-3">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold tabular-nums">
                      ${plan.monthlyPrice?.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      /month
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold tabular-nums text-muted-foreground">
                      ${plan.yearlyPrice?.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">/year</span>
                  </div>
                </div>

                {plan.features?.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {plan.features.map((feat, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Check className="h-3 w-3 text-success" />
                        {feat}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {plan.stripeProductId ? (
                    <Badge variant="secondary" className="text-xs">
                      Stripe Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      No Stripe Product
                    </Badge>
                  )}
                  {plan.stripePriceIdMonthly && (
                    <Badge variant="outline" className="text-xs">
                      Monthly Price
                    </Badge>
                  )}
                  {plan.stripePriceIdYearly && (
                    <Badge variant="outline" className="text-xs">
                      Yearly Price
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PlanFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        plan={editPlan}
        onSuccess={() => mutate()}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this hosting plan. Any existing
              subscriptions will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
