"use client"

import { useMemo, useState } from "react"
import { revalidate } from "@/lib/revalidate"
import useSWR from "swr"
import { toast } from "sonner"
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { PackageCard } from "@/components/packages/package-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"

// TODO: Create a form dialog for packages
import { PackageFormDialog } from "@/components/packages/package-form-dialog"

// TODO: Define Package type, probably in a shared file
interface Package {
  _id: string
  name: string
  price: number
  overview: string
  subcategory_id: string
  features: { name: string; value: boolean }[]
}

interface Subcategory {
  _id: string
  name: string
  category_id: string
}

interface Category {
  _id: string
  name: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PackagesPage() {
  const { data: packages, isLoading: packagesLoading, mutate } = useSWR<Package[]>("/api/packages", fetcher)
  const { data: subcategories, isLoading: subcategoriesLoading } = useSWR<Subcategory[]>("/api/subcategories", fetcher)
  const { data: categories, isLoading: categoriesLoading } = useSWR<Category[]>("/api/categories", fetcher)

  const [formOpen, setFormOpen] = useState(false)
  const [editPackage, setEditPackage] = useState<Package | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function handleEdit(pkg: Package) {
    setEditPackage(pkg)
    setFormOpen(true)
  }

  const groupedData = useMemo(() => {
    if (!packages || !subcategories || !categories) return []

    return categories.map(category => ({
      ...category,
      subcategories: subcategories
        .filter(sc => sc.category_id === category._id)
        .map(sc => ({
          ...sc,
          packages: packages.filter(p => p.subcategory_id === sc._id)
        }))
    }))
  }, [packages, subcategories, categories])

  const isLoading = packagesLoading || subcategoriesLoading || categoriesLoading

  async function handleDelete() {
    if (!deleteId) return
    try {
      // TODO: Update API endpoint for packages
      await fetch(`/api/packages?id=${deleteId}`, { method: "DELETE" })
      toast.success("Package deleted")
      mutate()
      revalidate()
    } catch {
      toast.error("Failed to delete package")
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Packages</h1>
          <p className="text-sm text-muted-foreground">Manage your packages and pricing</p>
        </div>
        <Button
          onClick={() => {
            setEditPackage(null)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Package
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : packages?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No packages yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Create your first package to get started.</p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => {
                setEditPackage(null)
                setFormOpen(true)
              }}
            >
              Create Package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
        {groupedData.map(category => (
          <div key={category._id}>
            <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
            <div className="mt-4 space-y-6">
              {category.subcategories.map(subcategory => (
                <div key={subcategory._id}>
                  <h3 className="text-lg font-medium">{subcategory.name}</h3>
                  {subcategory.packages.length > 0 ? (
                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {subcategory.packages.map(pkg => (
                        <PackageCard key={pkg._id} pkg={pkg} onEdit={handleEdit} onDelete={setDeleteId} />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No packages yet.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}

      <PackageFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        pkg={editPackage}
        onSuccess={() => mutate()}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this package. This action cannot be undone.
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
