"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrand, updateBrand } from "@/app/admin/actions";
import { toast } from "sonner";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ImageUploader } from "@/modules/admin/shared/components/ImageUploader";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  order: z.coerce.number(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function BrandForm({ initialData, id }: { initialData?: Partial<FormData>; id?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      imageUrl: initialData?.imageUrl || "",
      order: initialData?.order ?? 0,
      isActive: initialData?.isActive ?? true,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    let res;
    if (id) {
      res = await updateBrand(id, data);
    } else {
      res = await createBrand(data);
    }

    if (res.success) {
      toast.success(`Brand ${id ? "updated" : "created"} successfully!`);
      router.push("/admin/inventory/brands");
    } else {
      toast.error(res.error || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin/inventory/brands"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Brands
      </Link>

      <div className="bg-card border border-border rounded-xl p-6 shadow-card">
        <h2 className="font-serif font-bold text-xl mb-6">{id ? "Edit Brand" : "Create Brand"}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Brand Name</label>
            <input
              {...register("name")}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="e.g. Lakhani"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Display Order</label>
            <input
              type="number"
              {...register("order")}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="e.g. 1"
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
                  label="Brand Logo / Image"
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
              Active (Visible on marquee)
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
