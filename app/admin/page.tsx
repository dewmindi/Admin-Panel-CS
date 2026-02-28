"use client"

import useSWR from "swr"
import { StatCards } from "@/components/dashboard/stat-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { UpcomingRenewals } from "@/components/dashboard/upcoming-renewals"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { data, isLoading } = useSWR("/api/dashboard", fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[360px]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your business performance</p>
      </div>

      <StatCards stats={data?.stats || {}} />

      <RevenueChart data={data?.monthlyRevenue || []} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentOrders orders={data?.recentOrders || []} />
        <UpcomingRenewals renewals={data?.upcomingRenewals || []} />
      </div>
    </div>
  )
}
