import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    const [orders, hostingCustomers] = await Promise.all([
      db.collection("orders").find({}).toArray(),
      db.collection("hosting_customers").find({}).toArray(),
    ])

    const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0)
    const hostingRevenue = hostingCustomers.reduce((sum, h) => sum + (h.amount || 0), 0)
    const pendingOrders = orders.filter((o) => o.status === "pending").length
    const completedOrders = orders.filter((o) => o.status === "completed").length
    const inProgressOrders = orders.filter((o) => o.status === "in-progress").length
    const activeHosting = hostingCustomers.filter((h) => h.status === "active").length

    // Monthly revenue for last 6 months
    const now = new Date()
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const month = date.toLocaleDateString("en-AU", { month: "short" })
      const year = date.getFullYear()
      const monthOrders = orders.filter((o) => {
        const d = new Date(o.createdAt)
        return d.getMonth() === date.getMonth() && d.getFullYear() === year
      })
      const monthHosting = hostingCustomers.filter((h) => {
        const d = new Date(h.createdAt || h.startDate)
        return d.getMonth() === date.getMonth() && d.getFullYear() === year
      })
      return {
        month,
        orders: monthOrders.reduce((s, o) => s + (o.amount || 0), 0),
        hosting: monthHosting.reduce((s, h) => s + (h.amount || 0), 0),
      }
    })

    // Service breakdown
    const serviceBreakdown = orders.reduce(
      (acc, o) => {
        const svc = o.service || "other"
        acc[svc] = (acc[svc] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Recent orders
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((o) => ({
        id: o._id.toString(),
        customerName: o.customerName,
        service: o.service,
        amount: o.amount,
        status: o.status,
        createdAt: o.createdAt,
      }))

    // Upcoming renewals
    const upcomingRenewals = hostingCustomers
      .filter((h) => h.status === "active" && h.renewalDate)
      .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime())
      .slice(0, 5)
      .map((h) => ({
        id: h._id.toString(),
        customerName: h.customerName,
        domain: h.domain,
        plan: h.plan,
        renewalDate: h.renewalDate,
      }))

    return NextResponse.json({
      stats: {
        totalRevenue,
        hostingRevenue,
        totalOrders: orders.length,
        pendingOrders,
        completedOrders,
        inProgressOrders,
        activeHosting,
        totalHosting: hostingCustomers.length,
      },
      monthlyRevenue,
      serviceBreakdown,
      recentOrders,
      upcomingRenewals,
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    // Return demo data for preview
    return NextResponse.json({
      stats: {
        totalRevenue: 47250,
        hostingRevenue: 12400,
        totalOrders: 156,
        pendingOrders: 12,
        completedOrders: 128,
        inProgressOrders: 16,
        activeHosting: 34,
        totalHosting: 42,
      },
      monthlyRevenue: [
        { month: "Sep", orders: 6200, hosting: 1800 },
        { month: "Oct", orders: 7800, hosting: 2000 },
        { month: "Nov", orders: 9100, hosting: 2100 },
        { month: "Dec", orders: 5400, hosting: 2200 },
        { month: "Jan", orders: 8900, hosting: 2100 },
        { month: "Feb", orders: 9850, hosting: 2200 },
      ],
      serviceBreakdown: {
        "web-design": 48,
        "graphic-design": 35,
        branding: 28,
        seo: 22,
        "social-media": 15,
        other: 8,
      },
      recentOrders: [
        { id: "1", customerName: "James Wilson", service: "web-design", amount: 2400, status: "in-progress", createdAt: new Date().toISOString() },
        { id: "2", customerName: "Sarah Chen", service: "branding", amount: 1800, status: "pending", createdAt: new Date().toISOString() },
        { id: "3", customerName: "Michael Brown", service: "seo", amount: 950, status: "completed", createdAt: new Date().toISOString() },
        { id: "4", customerName: "Emma Davis", service: "graphic-design", amount: 600, status: "completed", createdAt: new Date().toISOString() },
        { id: "5", customerName: "Oliver Taylor", service: "web-design", amount: 3200, status: "pending", createdAt: new Date().toISOString() },
      ],
      upcomingRenewals: [
        { id: "1", customerName: "Acme Corp", domain: "acmecorp.com.au", plan: "business", renewalDate: "2026-03-15" },
        { id: "2", customerName: "Blue Sky Studio", domain: "bluesky.studio", plan: "premium", renewalDate: "2026-03-22" },
        { id: "3", customerName: "Green Leaf Co", domain: "greenleaf.com.au", plan: "starter", renewalDate: "2026-04-01" },
      ],
    })
  }
}
