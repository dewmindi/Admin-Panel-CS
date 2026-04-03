"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { Loader2, Trash2, UploadCloud, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

const SERVICE_OPTIONS = [
  { label: "Logo Design", value: "logo-design" },
  { label: "Business Card Design", value: "business-card-design" },
  { label: "Letter Head Design", value: "letter-head-design" },
  { label: "Email Signature Design", value: "email-signature-design" },
  { label: "Web Development", value: "web-development" },
  { label: "Social Media Design", value: "social-media-design" },
  { label: "Packaging & Label Design", value: "packaging-label-design" },
  { label: "Leaflet, Flyer & Brochure Design", value: "leaflet-flyer-brochure-design" },
]

interface PortfolioItem {
  id: string
  service: string
  title: string
  description: string
  imageUrl: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PortfolioPage() {
  const { data: items, isLoading } = useSWR<PortfolioItem[]>("/api/portfolio", fetcher)

  const [service, setService] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [weblink, setWeblink] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (files.length > 1) {
      toast.error("Please select only one image at a time.")
      e.target.value = ""
      return
    }

    const file = files[0]
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are allowed.")
      e.target.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.")
      e.target.value = ""
      return
    }

    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function clearFile() {
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Please select an image.")
      return
    }
    if (!service) {
      toast.error("Please select a service type.")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("service", service)
      formData.append("title", title)
      formData.append("description", description)
      formData.append("weblink", weblink)

      const res = await fetch("/api/portfolio/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed.")
        return
      }

      toast.success("Portfolio image uploaded successfully.")
      setService("")
      setTitle("")
      setDescription("")
      setWeblink("")
      clearFile()
      mutate("/api/portfolio")
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/portfolio?id=${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete.")
        return
      }
      toast.success("Portfolio item deleted.")
      mutate("/api/portfolio")
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const getServiceLabel = (value: string) =>
    SERVICE_OPTIONS.find((o) => o.value === value)?.label ?? value

  return (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload completed project images to showcase your work.
        </p>
      </div>

      {/* Upload Form */}
      <div className="rounded-xl border bg-card p-6 shadow-sm max-w-2xl">
        <h2 className="text-base font-semibold mb-5">Upload New Image</h2>
        <div className="grid gap-5">
          {/* Service */}
          <div className="grid gap-1.5">
            <Label htmlFor="service">
              Service Type <span className="text-destructive">*</span>
            </Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger id="service">
                <SelectValue placeholder="Select a service type" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="grid gap-1.5">
            <Label htmlFor="title">
              Title <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Landing Page Design"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="weblink">
              Website Link <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="weblink"
              placeholder="e.g. https://example.com"
              value={weblink}
              onChange={(e) => setWeblink(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="e.g. Modern, SEO optimized & mobile responsive website..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* File input */}
          <div className="grid gap-1.5">
            <Label>
              Image <span className="text-destructive">*</span>
            </Label>
            {preview ? (
              <div className="relative w-fit">
                <div className="relative h-40 w-64 overflow-hidden rounded-lg border">
                  <Image src={preview} alt="Preview" fill className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute -top-2 -right-2 rounded-full bg-destructive p-0.5 text-white shadow hover:bg-destructive/80"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="file-upload"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 px-6 py-8 text-center hover:border-muted-foreground/60 transition-colors"
              >
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to select an image
                </span>
                <span className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP or GIF · Max 5MB · One image only
                </span>
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          <Button onClick={handleUpload} disabled={uploading} className="w-full sm:w-auto">
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploading ? "Uploading…" : "Upload Image"}
          </Button>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div>
        <h2 className="text-base font-semibold mb-4">Uploaded Portfolio Images</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : !items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No portfolio images yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border bg-card overflow-hidden shadow-sm"
              >
                <div className="relative aspect-square w-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || item.service}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
                <div className="p-3 space-y-1">
                  <Badge variant="secondary" className="text-xs">
                    {getServiceLabel(item.service)}
                  </Badge>
                  {item.title && (
                    <p className="text-sm font-medium leading-tight truncate">{item.title}</p>
                  )}
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="absolute top-2 right-2 rounded-full bg-destructive/90 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-destructive"
                  aria-label="Delete item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portfolio Image</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the image from Cloudinary and the database. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
