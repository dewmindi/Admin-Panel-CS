"use client"

import { DollarSign, ShoppingCart, Clock, Server, TrendingUp, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Stats {
  totalRevenue: number
  hostingRevenue: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  inProgressOrders: number
  activeHosting: number
  totalHosting: number
}

export function StatCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      description: `+$${stats.hostingRevenue.toLocaleString()} hosting`,
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      description: `${stats.inProgressOrders} in progress`,
      icon: ShoppingCart,
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toString(),
      description: "Awaiting action",
      icon: Clock,
    },
    {
      title: "Completed",
      value: stats.completedOrders.toString(),
      description: `${((stats.completedOrders / Math.max(stats.totalOrders, 1)) * 100).toFixed(0)}% completion rate`,
      icon: CheckCircle2,
    },
    {
      title: "Active Hosting",
      value: stats.activeHosting.toString(),
      description: `${stats.totalHosting} total customers`,
      icon: Server,
    },
    {
      title: "Combined Revenue",
      value: `$${(stats.totalRevenue + stats.hostingRevenue).toLocaleString()}`,
      description: "Orders + Hosting",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
