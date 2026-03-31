"use client"

import { useEffect, useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { revalidate } from "@/lib/revalidate"
import { ImagePlus, Loader2, X, Wand2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { blogSchema, BlogInput } from "@/lib/schemas"

type RewriteMode = "improve" | "summarize" | "formal" | "casual" | "expand"

const REWRITE_MODES: { value: RewriteMode; label: string }[] = [
  { value: "improve", label: "Improve & polish" },
  { value: "expand", label: "Expand with detail" },
  { value: "summarize", label: "Summarize" },
  { value: "formal", label: "Make formal" },
  { value: "casual", label: "Make casual" },
]

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
}

interface BlogFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post?: BlogPost | null
  onSuccess: () => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function BlogFormDialog({ open, onOpenChange, post, onSuccess }: BlogFormDialogProps) {
  const [tagInput, setTagInput] = useState("")
  const [uploading, setUploading] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<BlogInput>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      category: "",
      tags: [],
      published: false,
      author: "",
      metaTitle: "",
      metaDescription: "",
    },
  })

  // useWatch is reliable for reactive updates after form.reset()
  const tags = useWatch({ control: form.control, name: "tags" }) ?? []
  const title = useWatch({ control: form.control, name: "title" }) ?? ""

  // Auto-generate slug from title when creating new post
  useEffect(() => {
    if (!post && title) {
      form.setValue("slug", slugify(title), { shouldValidate: false })
    }
  }, [title, post, form])

  useEffect(() => {
    if (open) {
      form.reset({
        title: post?.title ?? "",
        slug: post?.slug ?? "",
        excerpt: post?.excerpt ?? "",
        content: post?.content ?? "",
        coverImage: post?.coverImage ?? "",
        category: post?.category ?? "",
        tags: post?.tags ?? [],
        published: post?.published ?? false,
        author: post?.author ?? "",
        metaTitle: post?.metaTitle ?? "",
        metaDescription: post?.metaDescription ?? "",
      })
      setTagInput("")
    }
  }, [open, post, form])

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      form.setValue("tags", [...tags, trimmed])
    }
    setTagInput("")
  }

  function removeTag(tag: string) {
    form.setValue("tags", tags.filter((t) => t !== tag))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/blog/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      form.setValue("coverImage", data.url)
      toast.success("Image uploaded")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleRewrite(mode: RewriteMode) {
    const currentContent = form.getValues("content")
    const currentTitle = form.getValues("title")
    if (!currentContent || currentContent.trim().length < 10) {
      toast.error("Add some content before rewriting")
      return
    }
    setRewriting(true)
    try {
      const res = await fetch("/api/blog/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentContent, title: currentTitle, mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Rewrite failed")
      form.setValue("content", data.content, { shouldValidate: true })
      toast.success("Content rewritten by AI")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setRewriting(false)
    }
  }

  async function handleSubmit(data: BlogInput) {
    try {
      const url = post ? `/api/blog?id=${post._id}` : "/api/blog"
      const method = post ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to save post")

      toast.success(`Blog post ${post ? "updated" : "created"}`)
      onSuccess()
      onOpenChange(false)
      revalidate()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  // useWatch so image preview reacts to form.reset() with existing post data
  const coverImage = useWatch({ control: form.control, name: "coverImage" }) ?? ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? "Edit Blog Post" : "Create Blog Post"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter post title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="post-url-slug" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">URL-friendly identifier. Auto-generated from title.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Excerpt */}
            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excerpt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short description of the post"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content with AI Rewrite */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Content</FormLabel>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          disabled={rewriting}
                        >
                          {rewriting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                          {rewriting ? "Rewriting…" : "AI Rewrite"}
                          {!rewriting && <ChevronDown className="h-3 w-3 opacity-60" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {REWRITE_MODES.map((m) => (
                          <DropdownMenuItem
                            key={m.value}
                            onClick={() => handleRewrite(m.value)}
                          >
                            {m.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Write your blog post content here..."
                      rows={10}
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Supports plain text or HTML markup. Use AI Rewrite to improve, expand, or adjust tone.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover Image */}
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="https://... or /uploads/blog/..." {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        title="Upload image"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImagePlus className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                    {/* Preview: driven by useWatch so it reacts instantly to form.reset() */}
                    {coverImage && coverImage.length > 0 && (
                      <div className="relative w-full h-36 rounded-md overflow-hidden border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverImage}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).style.display = "none"
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() =>
                            form.setValue("coverImage", "", { shouldValidate: true })
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Design, Tech, News" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Author */}
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input placeholder="Author name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags */}
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="rounded-full hover:bg-muted ml-1"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </FormItem>

            {/* Meta Title */}
            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Title <span className="text-muted-foreground font-normal">(SEO)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="SEO page title (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Meta Description */}
            <FormField
              control={form.control}
              name="metaDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Description <span className="text-muted-foreground font-normal">(SEO)</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="SEO description (optional)" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Published */}
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-sm font-medium">Publish</FormLabel>
                    <p className="text-xs text-muted-foreground">Make this post visible on the website</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {post ? "Save Changes" : "Create Post"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
