"use client"

import Link from "next/link"
import useSWR from "swr"
import { FileText, ExternalLink, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ContentPage {
  slug: string
  title: string
  description?: string
  hasContent: boolean
  sectionCount: number
  status: string
}

export default function ContentPage() {
  const { data: pages, isLoading } = useSWR("/api/content", fetcher)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Content Management</h1>
        <p className="text-sm text-muted-foreground">
          Select a page to edit its content, sections, and images
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(pages as ContentPage[])?.map((page) => (
            <Card key={page.slug} className="group relative transition-colors hover:border-foreground/20">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">{page.title}</CardTitle>
                  </div>
                  <Badge variant={page.status === "published" ? "default" : "outline"} className="text-xs">
                    {page.status}
                  </Badge>
                </div>
                {page.description && (
                  <CardDescription className="text-xs">{page.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>/{page.slug}</span>
                    <span>{page.sectionCount} section{page.sectionCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a href={`https://csgraphicmeta.com.au/${page.slug === "home" ? "" : page.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="sr-only">View live page</span>
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link href={`/admin/content/${page.slug}`}>
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit page</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
