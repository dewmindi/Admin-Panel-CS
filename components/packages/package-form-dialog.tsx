"use client"

import { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { revalidate } from "@/lib/revalidate"
import { toast } from "sonner"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { packageSchema, PackageInput } from "@/lib/schemas"
import useSWR from "swr"

// TODO: Define Package type, probably in a shared file
interface SimpleFeature {
  name: string
  value: boolean
}

interface TitledGroup {
  title: string
  items: { text: string; highlight: boolean }[]
}

interface Package {
  _id: string
  name: string
  price: number
  overview: string
  subcategory_id: string
  features: (SimpleFeature | TitledGroup)[]
}

interface PackageFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pkg?: Package | null
  onSuccess: () => void
}

interface Subcategory {
  _id: string
  name: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PackageFormDialog({ open, onOpenChange, pkg, onSuccess }: PackageFormDialogProps) {
  const { data: subcategories } = useSWR<Subcategory[]>("/api/subcategories", fetcher)

  const form = useForm<PackageInput>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      price: 0,
      overview: "",
      subcategory_id: "",
      features: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features",
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: pkg?.name || "",
        price: pkg?.price || 0,
        overview: pkg?.overview || "",
        subcategory_id: pkg?.subcategory_id || "",
        features: pkg?.features || [],
      })
    }
  }, [open, pkg, form])

  async function handleSubmit(data: PackageInput) {
    try {
      const url = pkg ? `/api/packages?id=${pkg._id}` : "/api/packages"
      const method = pkg ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to save package")

      toast.success(`Package ${pkg ? "updated" : "created"}`)
      onSuccess()
      onOpenChange(false)
      revalidate()
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pkg ? "Edit Package" : "Create Package"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={isNaN(field.value) ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subcategory_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subcategories?.map((subcategory) => (
                        <SelectItem key={subcategory._id} value={subcategory._id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="overview"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overview</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <FormItem>
                <FormLabel>Features</FormLabel>
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    // @ts-ignore
                    if (field.title !== undefined) {
                      // Render Titled Group
                      return (
                        <div key={field.id} className="p-4 border rounded-md space-y-2">
                          <FormField
                            control={form.control}
                            name={`features.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Group Title</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <TitledGroupItems control={form.control} nestIndex={index} />
                          <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                            Remove Group
                          </Button>
                        </div>
                      )
                    } else {
                      // Render Simple Feature
                      return (
                        <div key={field.id} className="flex items-center gap-2 p-4 border rounded-md">
                          <FormField
                            control={form.control}
                            name={`features.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Feature Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`features.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 pt-8">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel>Enabled</FormLabel>
                              </FormItem>
                            )}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    }
                  })}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => append({ name: "", value: true })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Feature
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => append({ title: "", items: [] })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Titled Group
                  </Button>
                </div>
              </FormItem>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function TitledGroupItems({ nestIndex, control }: { nestIndex: number; control: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `features.${nestIndex}.items`,
  })

  return (
    <div className="space-y-2 pl-4">
      <FormLabel>Items</FormLabel>
      {fields.map((item, k) => (
        <div key={item.id} className="flex items-center gap-2">
          <FormField
            control={control}
            name={`features.${nestIndex}.items.${k}.text`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} placeholder="Item text" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`features.${nestIndex}.items.${k}.highlight`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="text-sm">Highlight</FormLabel>
              </FormItem>
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(k)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ text: "", highlight: false })}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Item
      </Button>
    </div>
  )
}
