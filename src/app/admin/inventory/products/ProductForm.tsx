"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/app/admin/actions";
import { toast } from "sonner";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { ImageUploader } from "@/modules/admin/shared/components/ImageUploader";
import { RichTextEditor } from "@/modules/admin/shared/components/RichTextEditor";

const variantSchema = z.object({
  size: z.coerce.number().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  colorHex: z.string().min(1, "Color hex is required"),
  stock: z.coerce.number().min(0, "Stock cannot be negative"),
  sku: z.string().min(1, "SKU is required"),
  images: z.array(
    z.object({
      url: z.string().url("Must be a valid URL"),
      public_id: z.string(),
    }),
  ),
});

const schema = z.object({
  name: z.string().min(3, "Name is required"),
  slug: z.string().min(3, "Slug is required"),
  description: z.string().min(10, "Description is required"),
  brand: z.string().min(1, "Brand is required"),
  category: z.string().min(1, "Category is required"),
  gender: z.enum(["Men", "Women", "Children", "Unisex"]),
  occasion: z.array(z.string()).min(1, "At least one occasion is required"),
  images: z
    .array(
      z.object({
        url: z.string().url("Must be a valid URL"),
        public_id: z.string(),
      }),
    )
    .min(1, "At least one image is required"),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  salePrice: z.coerce.number().min(0, "Sale price must be positive"),
  returnDays: z.coerce.number().min(0, "Return days cannot be negative"),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  isActive: z.boolean(),
  tags: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

export function ProductForm({
  initialData,
  id,
  categories,
  brands = [],
}: {
  initialData?: Partial<FormData>;
  id?: string;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(!!id);

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
      brand: initialData?.brand || "",
      category: initialData?.category || "",
      gender: initialData?.gender || "Unisex",
      occasion:
        initialData?.occasion && initialData.occasion.length > 0 ? initialData.occasion : ["Daily"],
      images: initialData?.images || [{ url: "", public_id: "placeholder" }],
      variants: initialData?.variants || [
        { size: 7, color: "Black", colorHex: "#000000", stock: 10, sku: "", images: [] },
      ],
      price: initialData?.price || 0,
      salePrice: initialData?.salePrice || 0,
      returnDays: initialData?.returnDays ?? 7,
      isFeatured: initialData?.isFeatured ?? false,
      isNewArrival: initialData?.isNewArrival ?? false,
      isActive: initialData?.isActive ?? true,
    },
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({ control, name: "images" });
  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control, name: "variants" });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    register("name").onChange(e);
    if (!id && !isSlugManual) {
      setValue(
        "slug",
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, ""),
        { shouldValidate: true },
      );
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManual(true);
    register("slug").onChange(e);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    let res;
    if (id) {
      res = await updateProduct(id, data);
    } else {
      res = await createProduct(data);
    }

    if (res.success) {
      toast.success(`Product ${id ? "updated" : "created"} successfully!`);
      router.push("/admin/inventory/products");
    } else {
      toast.error(res.error || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/admin/inventory/products"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Products
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <h2 className="font-serif font-bold text-xl mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                {...register("name")}
                onChange={handleNameChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                {...register("slug")}
                onChange={handleSlugChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <select
                {...register("brand")}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              >
                <option value="">Select a brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                {...register("category")}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    label="Description"
                  />
                )}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <h2 className="font-serif font-bold text-xl mb-6">Pricing & Classifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (MRP)</label>
              <input
                type="number"
                {...register("price")}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sale Price</label>
              <input
                type="number"
                {...register("salePrice")}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              {errors.salePrice && (
                <p className="text-red-500 text-xs mt-1">{errors.salePrice.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Return Policy (Days)</label>
              <input
                type="number"
                {...register("returnDays")}
                min="0"
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              {errors.returnDays && (
                <p className="text-red-500 text-xs mt-1">{errors.returnDays.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                {...register("gender")}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Children">Children</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active Status
              </label>
            </div>

            {/* Occasion Checklist */}
            <div className="md:col-span-5 border-t border-border/40 pt-4 mt-2">
              <label className="block text-sm font-medium mb-2">Occasion(s)</label>
              <div className="flex flex-wrap gap-4">
                {["Daily", "Wedding", "Bridal", "Party", "Function", "Sports"].map((occ) => (
                  <label
                    key={occ}
                    className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={occ}
                      {...register("occasion")}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    {occ}
                  </label>
                ))}
              </div>
              {errors.occasion && (
                <p className="text-red-500 text-xs mt-1">{errors.occasion.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif font-bold text-xl">Images (URLs)</h2>
            <button
              type="button"
              onClick={() => appendImage({ url: "", public_id: "placeholder" })}
              className="text-sm bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Image
            </button>
          </div>
          {errors.images && !Array.isArray(errors.images) && (
            <p className="text-red-500 text-sm mb-4">{(errors.images as any).message}</p>
          )}
          <div className="space-y-4">
            {imageFields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-1 border border-border/40 p-4 rounded-lg bg-muted/5 relative"
              >
                <div className="flex items-start gap-2 w-full">
                  <div className="flex-1">
                    <Controller
                      control={control}
                      name={`images.${index}.url` as const}
                      render={({ field: uploaderField }) => (
                        <ImageUploader
                          value={uploaderField.value || ""}
                          onChange={uploaderField.onChange}
                          placeholder="Image URL (e.g. https://images.unsplash.com/... or upload a file)"
                        />
                      )}
                    />
                  </div>
                  {imageFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-md mt-1 cursor-pointer self-start"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {errors.images?.[index]?.url && (
                  <p className="text-red-500 text-xs mt-1">{errors.images[index].url.message}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif font-bold text-xl">Variants (Size/Color)</h2>
            <button
              type="button"
              onClick={() =>
                appendVariant({
                  size: 8,
                  color: "Black",
                  colorHex: "#000000",
                  stock: 10,
                  sku: "",
                  images: [],
                })
              }
              className="text-sm bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Variant
            </button>
          </div>
          {errors.variants && !Array.isArray(errors.variants) && (
            <p className="text-red-500 text-sm mb-4">{(errors.variants as any).message}</p>
          )}
          <div className="space-y-6">
            {variantFields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-5 gap-3 items-start border border-border/50 p-4 rounded-lg bg-muted/10 relative"
              >
                <div>
                  <label className="block text-xs font-medium mb-1">Size</label>
                  <input
                    type="number"
                    {...register(`variants.${index}.size` as const)}
                    className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background"
                  />
                  {errors.variants?.[index]?.size && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {errors.variants[index].size.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Color Name</label>
                  <input
                    {...register(`variants.${index}.color` as const)}
                    className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background"
                  />
                  {errors.variants?.[index]?.color && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {errors.variants[index].color.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Color Hex</label>
                  <input
                    type="color"
                    {...register(`variants.${index}.colorHex` as const)}
                    className="w-full h-8 p-0.5 border border-border rounded bg-background cursor-pointer"
                  />
                  {errors.variants?.[index]?.colorHex && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {errors.variants[index].colorHex.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Stock</label>
                  <input
                    type="number"
                    {...register(`variants.${index}.stock` as const)}
                    className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background"
                  />
                  {errors.variants?.[index]?.stock && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {errors.variants[index].stock.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">SKU</label>
                  <input
                    {...register(`variants.${index}.sku` as const)}
                    className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background"
                  />
                  {errors.variants?.[index]?.sku && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {errors.variants[index].sku.message}
                    </p>
                  )}
                </div>

                {/* Variant level images selector */}
                <div className="col-span-5 mt-3 pt-3 border-t border-border/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                      Variant-Specific Images
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentImages = watch(`variants.${index}.images`) || [];
                        setValue(`variants.${index}.images`, [
                          ...currentImages,
                          { url: "", public_id: `var-${index}-img-${currentImages.length}` },
                        ]);
                      }}
                      className="text-[10px] bg-muted hover:bg-muted/80 px-2 py-1 rounded flex items-center gap-1 font-semibold transition cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Add Variant Photo
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(watch(`variants.${index}.images`) || []).map(
                      (imgField: any, imgIndex: number) => (
                        <div key={imgIndex} className="flex flex-col gap-1">
                          <div className="flex gap-2 items-center">
                            <div className="flex-1">
                              <Controller
                                control={control}
                                name={`variants.${index}.images.${imgIndex}.url` as const}
                                render={({ field: uploaderField }) => (
                                  <ImageUploader
                                    value={uploaderField.value || ""}
                                    onChange={(val) => {
                                      uploaderField.onChange(val);
                                      // Auto-generate public_id if empty
                                      if (
                                        !watch(`variants.${index}.images.${imgIndex}.public_id`)
                                      ) {
                                        setValue(
                                          `variants.${index}.images.${imgIndex}.public_id`,
                                          `var-${index}-img-${imgIndex}`,
                                        );
                                      }
                                    }}
                                    placeholder="Variant Image URL or upload a file"
                                  />
                                )}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const currentImages = watch(`variants.${index}.images`) || [];
                                setValue(
                                  `variants.${index}.images`,
                                  currentImages.filter((_: any, i: number) => i !== imgIndex),
                                );
                              }}
                              className="p-2 text-destructive hover:bg-destructive/10 rounded cursor-pointer mt-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {errors.variants?.[index]?.images?.[imgIndex]?.url && (
                            <p className="text-red-500 text-[10px]">
                              {errors.variants[index].images[imgIndex].url.message}
                            </p>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {variantFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-background border border-border shadow-sm text-destructive hover:bg-destructive hover:text-white rounded-full transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 text-lg shadow-sm cursor-pointer"
          >
            {loading ? "Saving Product..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
