import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { connectToDatabase as dbConnect } from "@/lib/db";
import Category from "@/lib/models/Category";
import Product from "@/lib/models/Product";
import { CategoriesClient } from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
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

  const [categoriesRaw, totalItems] = await Promise.all([
    Category.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Category.countDocuments(query),
  ]);

  // Serialize for client component
  const categories = await Promise.all(
    categoriesRaw.map(async (cat: any) => {
      const productCount = await Product.countDocuments({ category: cat._id });
      return {
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        isActive: cat.isActive,
        imageUrl: cat.imageUrl || "",
        productCount,
        createdAt: cat.createdAt?.toISOString() || new Date().toISOString(),
      };
    }),
  );

  return (
    <DashboardPage eyebrow="Categories" title="Categories">
      <CategoriesClient categories={categories} totalItems={totalItems} />
    </DashboardPage>
  );
}
