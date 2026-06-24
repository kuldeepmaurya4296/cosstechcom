import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { connectToDatabase as dbConnect } from "@/lib/db";
import Brand from "@/lib/models/Brand";
import Product from "@/lib/models/Product";
import { BrandsClient } from "./BrandsClient";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage({
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
    query.$or = [{ name: { $regex: q, $options: "i" } }];
  }

  const sortObj: any = {};
  sortObj[sortKey] = sortOrder;

  const [brandsRaw, totalItems] = await Promise.all([
    Brand.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Brand.countDocuments(query),
  ]);

  const brands = await Promise.all(
    brandsRaw.map(async (b: any) => {
      const productCount = await Product.countDocuments({ brand: b._id });
      return {
        id: b._id.toString(),
        name: b.name,
        imageUrl: b.imageUrl || "",
        order: b.order || 0,
        isActive: b.isActive,
        productCount,
        createdAt: b.createdAt?.toISOString() || new Date().toISOString(),
      };
    }),
  );

  return (
    <DashboardPage eyebrow="Catalog" title="Brands">
      <BrandsClient brands={brands} totalItems={totalItems} />
    </DashboardPage>
  );
}
