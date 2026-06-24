"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCollection, updateCollection } from "@/app/admin/actions";
import { toast } from "sonner";
import Link from "next/link";
import { ChevronLeft, Search, Check } from "lucide-react";
import { ImageUploader } from "@/modules/admin/shared/components/ImageUploader";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
}

export function CollectionForm({
  initialData,
  id,
  productsList = [],
}: {
  initialData?: Partial<FormData> & { products?: string[] };
  id?: string;
  productsList: ProductItem[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(initialData?.products || []);
  const [searchQuery, setSearchQuery] = useState("");

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
      imageUrl: initialData?.imageUrl || "",
      isActive: initialData?.isActive ?? true,
      isFeatured: initialData?.isFeatured ?? false,
    },
  });

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

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((p) => p !== productId) : [...prev, productId],
    );
  };

  const filteredProducts = productsList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const payload = {
      ...data,
      products: selectedProducts,
    };

    let res;
    if (id) {
      res = await updateCollection(id, payload);
    } else {
      res = await createCollection(payload);
    }

    if (res.success) {
      toast.success(`Collection ${id ? "updated" : "created"} successfully!`);
      router.push("/admin/inventory/collections");
    } else {
      toast.error(res.error || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin/inventory/collections"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Collections
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <h2 className="font-serif font-bold text-xl mb-6">
            {id ? "Edit Collection" : "Create Collection"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Collection Name</label>
              <input
                {...register("name")}
                onChange={handleNameChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="e.g. Winter Boots Showcase"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                {...register("slug")}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="e.g. winter-boots-showcase"
              />
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Editorial Description</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="Write collection marketing summary..."
              />
            </div>

            <div className="md:col-span-2">
              <Controller
                control={control}
                name="imageUrl"
                render={({ field }) => (
                  <ImageUploader
                    value={field.value || ""}
                    onChange={field.onChange}
                    label="Collection Cover Image"
                    placeholder="e.g. https://images.unsplash.com/... or upload a file"
                  />
                )}
              />
            </div>

            <div className="flex gap-6 items-center pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active (Visible)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  {...register("isFeatured")}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isFeatured" className="text-sm font-medium">
                  Featured Collection
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Product Selection Block */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-serif font-bold text-lg">Select Products</h3>
              <p className="text-xs text-muted-foreground">
                {selectedProducts.length} products selected in this collection
              </p>
            </div>
            <div className="relative w-64">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name/brand..."
                className="w-full pl-8 pr-3 py-1.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
              />
            </div>
          </div>

          <div className="border border-border rounded-lg max-h-[320px] overflow-y-auto divide-y divide-border bg-background">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No active products found matching search.
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const isChecked = selectedProducts.includes(prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => toggleProduct(prod.id)}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded overflow-hidden bg-muted border border-border shrink-0">
                        <img src={prod.image} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{prod.name}</p>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">
                          {prod.brand}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`h-5 w-5 border rounded flex items-center justify-center transition-colors ${isChecked ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background"}`}
                    >
                      {isChecked && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 text-lg shadow-sm"
          >
            {loading ? "Saving Collection..." : "Save Collection"}
          </button>
        </div>
      </form>
    </div>
  );
}
