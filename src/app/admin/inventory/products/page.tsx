import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { connectToDatabase as dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Category";
import { ProductsClient } from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await dbConnect();
  const params = await searchParams;

  const q = params.q || "";
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const sortKey = params.sort || "createdAt";
  const sortOrder = params.order === "asc" ? 1 : -1;

  const query: any = {};
  if (q) {
    query.$or = [{ name: { $regex: q, $options: "i" } }, { slug: { $regex: q, $options: "i" } }];
  }

  const sortObj: any = {};
  sortObj[sortKey] = sortOrder;

  const [productsRaw, totalItems] = await Promise.all([
    Product.find(query)
      .populate({ path: "category", model: Category, select: "name" })
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  const products = productsRaw.map((p: any) => {
    // Total stock is sum of all variant stocks
    const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;

    return {
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      price: p.salePrice || p.price,
      stock: totalStock,
      category: p.category?.name || "Unknown",
      image: p.images?.[0]?.url || "/assets/placeholder.jpg",
      rating: p.rating?.average || 0,
      reviewsCount: p.rating?.count || 0,
      isActive: p.isActive,
    };
  });

  return (
    <DashboardPage eyebrow="Inventory" title="Products">
      <ProductsClient products={products} totalItems={totalItems} />
    </DashboardPage>
  );
}
