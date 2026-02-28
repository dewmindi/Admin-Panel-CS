"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface RecentOrder {
  id: string
  customerName: string
  service: string
  amount: number
  status: string
  createdAt: string
}

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

export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <CardDescription>Latest orders from customers</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/orders">
            View all
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{order.customerName}</span>
                <span className="text-xs text-muted-foreground">{serviceLabels[order.service] || order.service}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant[order.status] || "outline"} className="text-xs capitalize">
                  {order.status.replace("-", " ")}
                </Badge>
                <span className="text-sm font-medium tabular-nums">${order.amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">No recent orders</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
