"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory } from "@/app/admin/actions";
import { toast } from "sonner";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ImageUploader } from "@/modules/admin/shared/components/ImageUploader";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

type FormData = z.infer<typeof schema>;

export function CategoryForm({
  initialData,
  id,
}: {
  initialData?: Partial<FormData>;
  id?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      isActive: initialData?.isActive ?? true,
      imageUrl: initialData?.imageUrl || "",
    },
  });

  const imageUrlValue = watch("imageUrl");

  // Auto-generate slug from name if slug is empty
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("name", val);
    if (!initialData?.slug && !watch("slug")) {
      setValue(
        "slug",
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, ""),
      );
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    let res;
    if (id) {
      res = await updateCategory(id, data);
    } else {
      res = await createCategory(data);
    }

    if (res.success) {
      toast.success(`Category ${id ? "updated" : "created"} successfully!`);
      router.push("/admin/inventory/categories");
    } else {
      toast.error(res.error || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin/inventory/categories"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Categories
      </Link>

      <div className="bg-card border border-border rounded-xl p-6 shadow-card">
        <h2 className="font-serif font-bold text-xl mb-6">
          {id ? "Edit Category" : "Create Category"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              {...register("name")}
              onChange={handleNameChange}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="e.g. Running Shoes"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input
              {...register("slug")}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="e.g. running-shoes"
            />
            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register("description")}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              rows={4}
              placeholder="Short description about the category"
            />
          </div>

          <div>
            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <ImageUploader
                  value={field.value || ""}
                  onChange={field.onChange}
                  label="Category Image"
                  placeholder="e.g. https://images.unsplash.com/... or upload a file"
                />
              )}
            />
            {errors.imageUrl && (
              <p className="text-red-500 text-xs mt-1">{errors.imageUrl.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active (Visible on store)
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
