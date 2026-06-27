import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { ProductForm } from "../../ProductForm";
import { connectToDatabase as dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Category";
import Brand from "@/lib/models/Brand";
import { notFound } from "next/navigation";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!mongoose.isValidObjectId(id)) {
    notFound();
  }

  await dbConnect();

  const [productRaw, categoriesRaw, brandsRaw] = await Promise.all([
    Product.findById(id).lean(),
    Category.find({ isActive: true }).select("name _id").lean(),
    Brand.find({ isActive: true }).select("name _id").sort({ name: 1 }).lean(),
  ]);

  if (!productRaw) {
    notFound();
  }

  const categories = categoriesRaw.map((c: any) => ({
    id: c._id.toString(),
    name: c.name,
  }));

  const brands = brandsRaw.map((b: any) => ({
    id: b._id.toString(),
    name: b.name,
  }));

  // Clean up MongoDB object before passing to client component
  const initialData = {
    name: productRaw.name,
    slug: productRaw.slug,
    description: productRaw.description,
    brand: productRaw.brand?.toString() || "",
    category: productRaw.category?.toString() || "",
    gender: productRaw.gender,
    occasion: productRaw.occasion || [],
    images:
      productRaw.images?.map((img: any) => ({ url: img.url, public_id: img.public_id })) || [],
    variants:
      productRaw.variants?.map((v: any) => ({
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        stock: v.stock,
        sku: v.sku,
        images: v.images?.map((img: any) => ({ url: img.url, public_id: img.public_id })) || [],
      })) || [],
    price: productRaw.price,
    salePrice: productRaw.salePrice,
    isFeatured: productRaw.isFeatured,
    isNewArrival: productRaw.isNewArrival,
    isActive: productRaw.isActive,
    tags: productRaw.tags || [],
  };

  return (
    <DashboardPage eyebrow="Inventory" title="Edit Product">
      <div className="py-6">
        <ProductForm initialData={initialData} id={id} categories={categories} brands={brands} />
      </div>
    </DashboardPage>
  );
}
