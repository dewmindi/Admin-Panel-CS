"use client"

import { useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Upload,
  Loader2,
  ImageIcon,
  Type,
  Layout,
  Megaphone,
  Star,
  Grid3X3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Section {
  id: string
  type: "hero" | "text" | "image" | "gallery" | "cta" | "features" | "testimonials"
  title?: string
  content?: string
  imageUrl?: string
  images?: string[]
  order: number
}

const sectionTypes = [
  { value: "hero", label: "Hero Section", icon: Layout },
  { value: "text", label: "Text Block", icon: Type },
  { value: "image", label: "Image Section", icon: ImageIcon },
  { value: "gallery", label: "Image Gallery", icon: Grid3X3 },
  { value: "cta", label: "Call to Action", icon: Megaphone },
  { value: "features", label: "Features", icon: Star },
  { value: "testimonials", label: "Testimonials", icon: Star },
]

export default function ContentEditorPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const { data: pageData, isLoading } = useSWR(`/api/content?slug=${slug}`, fetcher)

  const [title, setTitle] = useState("")
  const [sections, setSections] = useState<Section[]>([])
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [status, setStatus] = useState("draft")
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Initialize from data
  if (pageData && !initialized) {
    setTitle(pageData.title || "")
    setSections(pageData.sections || [])
    setMetaTitle(pageData.metaTitle || "")
    setMetaDescription(pageData.metaDescription || "")
    setStatus(pageData.status || "draft")
    setInitialized(true)
  }

  function addSection(type: Section["type"]) {
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      title: "",
      content: "",
      imageUrl: "",
      images: [],
      order: sections.length,
    }
    setSections([...sections, newSection])
  }

  function updateSection(id: string, updates: Partial<Section>) {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  function removeSection(id: string) {
    setSections(sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })))
  }

  function moveSection(index: number, direction: -1 | 1) {
    const newSections = [...sections]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newSections.length) return
    const temp = newSections[index]
    newSections[index] = newSections[targetIndex]
    newSections[targetIndex] = temp
    setSections(newSections.map((s, i) => ({ ...s, order: i })))
  }

  const handleImageUpload = useCallback(async (sectionId: string, field: "imageUrl" | "images") => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.multiple = field === "images"

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files?.length) return

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        try {
          const res = await fetch("/api/content/upload", { method: "POST", body: formData })
          const data = await res.json()

          if (data.url) {
            if (field === "imageUrl") {
              updateSection(sectionId, { imageUrl: data.url })
            } else {
              const section = sections.find((s) => s.id === sectionId)
              updateSection(sectionId, { images: [...(section?.images || []), data.url] })
            }
            toast.success("Image uploaded")
          }
        } catch {
          toast.error("Upload failed")
        }
      }
    }

    input.click()
  }, [sections])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          sections,
          status,
          metaTitle,
          metaDescription,
        }),
      })

      if (!res.ok) throw new Error()
      toast.success("Content saved successfully")
    } catch {
      toast.error("Failed to save content")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/admin/content")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{title || slug}</h1>
            <p className="text-sm text-muted-foreground">/{slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label>Page Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Sections ({sections.length})</h2>
            <Select onValueChange={(v) => addSection(v as Section["type"])}>
              <SelectTrigger className="w-[180px]">
                <Plus className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Add section" />
              </SelectTrigger>
              <SelectContent>
                {sectionTypes.map((st) => (
                  <SelectItem key={st.value} value={st.value}>
                    <div className="flex items-center gap-2">
                      <st.icon className="h-3.5 w-3.5" />
                      {st.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Layout className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">No sections yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add a section using the dropdown above</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {sections.map((section, index) => {
                const sectionType = sectionTypes.find((st) => st.value === section.type)
                const Icon = sectionType?.icon || ImageIcon

                return (
                  <Card key={section.id}>
                    <CardHeader className="flex flex-row items-center gap-3 pb-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 cursor-grab" onClick={() => moveSection(index, -1)} disabled={index === 0}>
                          <GripVertical className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">{sectionType?.label}</CardTitle>
                        <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeSection(section.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2">
                        <Label className="text-xs">Section Title</Label>
                        <Input
                          value={section.title || ""}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          placeholder="Section title"
                        />
                      </div>

                      {(section.type === "text" || section.type === "hero" || section.type === "cta" || section.type === "features" || section.type === "testimonials") && (
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs">Content</Label>
                          <Textarea
                            value={section.content || ""}
                            onChange={(e) => updateSection(section.id, { content: e.target.value })}
                            placeholder="Section content..."
                            rows={4}
                          />
                        </div>
                      )}

                      {(section.type === "image" || section.type === "hero") && (
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs">Image</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={section.imageUrl || ""}
                              onChange={(e) => updateSection(section.id, { imageUrl: e.target.value })}
                              placeholder="Image URL or upload"
                              className="flex-1"
                            />
                            <Button variant="outline" size="sm" onClick={() => handleImageUpload(section.id, "imageUrl")}>
                              <Upload className="mr-1 h-3.5 w-3.5" />
                              Upload
                            </Button>
                          </div>
                          {section.imageUrl && (
                            <div className="relative h-32 rounded-md border overflow-hidden bg-muted">
                              <img src={section.imageUrl || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                            </div>
                          )}
                        </div>
                      )}

                      {section.type === "gallery" && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Gallery Images ({section.images?.length || 0})</Label>
                            <Button variant="outline" size="sm" onClick={() => handleImageUpload(section.id, "images")}>
                              <Upload className="mr-1 h-3.5 w-3.5" />
                              Add Images
                            </Button>
                          </div>
                          {section.images && section.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                              {section.images.map((img, imgIndex) => (
                                <div key={imgIndex} className="group relative h-20 rounded-md border overflow-hidden bg-muted">
                                  <img src={img || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                                  <button
                                    className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={() => {
                                      const newImages = [...(section.images || [])]
                                      newImages.splice(imgIndex, 1)
                                      updateSection(section.id, { images: newImages })
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="seo" className="flex flex-col gap-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Meta Title</Label>
                <Input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Page title for search engines"
                />
                <p className="text-xs text-muted-foreground">{metaTitle.length}/60 characters</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Brief description for search engine results"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{metaDescription.length}/160 characters</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
