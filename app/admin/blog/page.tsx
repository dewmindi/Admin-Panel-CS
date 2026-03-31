"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { revalidate } from "@/lib/revalidate"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
  FileText,
  Eye,
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
import { Card, CardContent } from "@/components/ui/card"
import { BlogFormDialog } from "@/components/blog/blog-form-dialog"

interface BlogPost {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  category?: string
  tags: string[]
  published: boolean
  author?: string
  metaTitle?: string
  metaDescription?: string
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const ITEMS_PER_PAGE = 10

export default function BlogPage() {
  const { data: posts, isLoading, mutate } = useSWR<BlogPost[]>("/api/blog", fetcher)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editPost, setEditPost] = useState<BlogPost | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!posts) return []
    return posts.filter((p) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        (p.category ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.author ?? "").toLowerCase().includes(search.toLowerCase())

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && p.published) ||
        (statusFilter === "draft" && !p.published)

      return matchSearch && matchStatus
    })
  }, [posts, search, statusFilter])

  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  function handleEdit(post: BlogPost) {
    setEditPost(post)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/blog?id=${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete post")
      toast.success("Blog post deleted")
      mutate()
      revalidate()
    } catch {
      toast.error("Failed to delete blog post")
    } finally {
      setDeleteId(null)
    }
  }

  async function handleTogglePublish(post: BlogPost) {
    try {
      const res = await fetch(`/api/blog?id=${post._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...post, published: !post.published }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success(post.published ? "Post unpublished" : "Post published")
      mutate()
      revalidate()
    } catch {
      toast.error("Failed to update post status")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Blog Posts</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, and manage blog content
          </p>
        </div>
        <Button
          onClick={() => {
            setEditPost(null)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="pl-8"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v); setPage(0) }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">
              {posts?.length === 0 ? "No blog posts yet" : "No posts match your filters"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {posts?.length === 0
                ? "Create your first post to get started."
                : "Try adjusting your search or filter."}
            </p>
            {posts?.length === 0 && (
              <Button
                className="mt-4"
                size="sm"
                onClick={() => { setEditPost(null); setFormOpen(true) }}
              >
                Create Post
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="w-[56px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((post) => (
                <TableRow key={post._id}>
                  <TableCell>
                    {post.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-10 w-10 rounded object-cover border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium line-clamp-1">{post.title}</p>
                      <p className="text-xs text-muted-foreground">/{post.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {post.category ? (
                      <Badge variant="outline" className="text-xs">
                        {post.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {post.author || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={post.published ? "default" : "outline"}
                      className="text-xs"
                    >
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
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
                        <DropdownMenuItem onClick={() => handleEdit(post)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleTogglePublish(post)}
                        >
                          {post.published ? (
                            <>
                              <FileText className="mr-2 h-4 w-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Globe className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={`https://csgraphicmeta.com.au/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View on site
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(post._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {page * ITEMS_PER_PAGE + 1}–
            {Math.min((page + 1) * ITEMS_PER_PAGE, filtered.length)} of{" "}
            {filtered.length} posts
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <BlogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        post={editPost}
        onSuccess={() => mutate()}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this post. This action cannot be undone.
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
