"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar } from "lucide-react"

interface Renewal {
  id: string
  customerName: string
  domain: string
  plan: string
  renewalDate: string
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function UpcomingRenewals({ renewals }: { renewals: Renewal[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Upcoming Renewals</CardTitle>
          <CardDescription>Hosting renewals due soon</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/hosting">
            View all
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {renewals.map((renewal) => {
            const days = daysUntil(renewal.renewalDate)
            const isUrgent = days <= 7
            const isSoon = days <= 30

            return (
              <div key={renewal.id} className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{renewal.customerName}</span>
                  <span className="text-xs text-muted-foreground">{renewal.domain}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {renewal.plan}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs tabular-nums">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className={isUrgent ? "text-destructive font-medium" : isSoon ? "text-warning font-medium" : "text-muted-foreground"}>
                      {days <= 0 ? "Overdue" : `${days}d`}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          {renewals.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">No upcoming renewals</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
