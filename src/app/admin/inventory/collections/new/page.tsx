import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { CollectionForm } from "../CollectionForm";
import { connectToDatabase as dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import Brand from "@/lib/models/Brand";

export const dynamic = "force-dynamic";

export default async function NewCollectionPage() {
  await dbConnect();

  // Fetch products to choose from
  const productsRaw = await Product.find({ isActive: true })
    .populate({ path: "brand", model: Brand })
    .select("name brand price images")
    .sort({ name: 1 })
    .lean();

  const productsList = productsRaw.map((p: any) => {
    const brandName =
      p.brand && typeof p.brand === "object" && "name" in p.brand
        ? p.brand.name
        : p.brand || "CosstechCom";

    return {
      id: p._id.toString(),
      name: p.name,
      brand: brandName,
      price: p.salePrice || p.price,
      image: p.images?.[0]?.url || "/assets/placeholder.jpg",
    };
  });

  return (
    <DashboardPage eyebrow="Catalog" title="New Collection">
      <div className="py-6">
        <CollectionForm productsList={productsList} />
      </div>
    </DashboardPage>
  );
}
