import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { ProductForm } from "../ProductForm";
import { connectToDatabase as dbConnect } from "@/lib/db";
import Category from "@/lib/models/Category";
import Brand from "@/lib/models/Brand";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await dbConnect();

  const [categoriesRaw, brandsRaw] = await Promise.all([
    Category.find({ isActive: true }).select("name _id").lean(),
    Brand.find({ isActive: true }).select("name _id").sort({ name: 1 }).lean(),
  ]);

  const categories = categoriesRaw.map((c: any) => ({
    id: c._id.toString(),
    name: c.name,
  }));

  const brands = brandsRaw.map((b: any) => ({
    id: b._id.toString(),
    name: b.name,
  }));

  return (
    <DashboardPage eyebrow="Inventory" title="New Product">
      <div className="py-6">
        <ProductForm categories={categories} brands={brands} />
      </div>
    </DashboardPage>
  );
}
