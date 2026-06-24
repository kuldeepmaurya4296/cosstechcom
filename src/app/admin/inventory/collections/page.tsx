import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { connectToDatabase as dbConnect } from "@/lib/db";
import Collection from "@/lib/models/Collection";
import { CollectionsClient } from "./CollectionsClient";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage({
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

  const [collectionsRaw, totalItems] = await Promise.all([
    Collection.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Collection.countDocuments(query),
  ]);

  const collections = collectionsRaw.map((c: any) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    imageUrl: c.imageUrl || "",
    isFeatured: c.isFeatured || false,
    isActive: c.isActive,
    productCount: c.products?.length || 0,
    createdAt: c.createdAt?.toISOString() || new Date().toISOString(),
  }));

  return (
    <DashboardPage eyebrow="Catalog" title="Collections">
      <CollectionsClient collections={collections} totalItems={totalItems} />
    </DashboardPage>
  );
}
