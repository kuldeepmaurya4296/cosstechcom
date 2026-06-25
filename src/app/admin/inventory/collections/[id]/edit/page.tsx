import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { CollectionForm } from "../../CollectionForm";
import { connectToDatabase as dbConnect } from "@/lib/db";
import Collection from "@/lib/models/Collection";
import Product from "@/lib/models/Product";
import Brand from "@/lib/models/Brand";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;

  const [collectionRaw, productsRaw] = await Promise.all([
    Collection.findById(id).lean(),
    Product.find({ isActive: true })
      .populate({ path: "brand", model: Brand })
      .select("name brand price images")
      .sort({ name: 1 })
      .lean(),
  ]);

  if (!collectionRaw) {
    notFound();
  }

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

  const initialData = {
    name: collectionRaw.name,
    slug: collectionRaw.slug,
    description: collectionRaw.description || "",
    imageUrl: collectionRaw.imageUrl || "",
    isActive: collectionRaw.isActive,
    isFeatured: collectionRaw.isFeatured || false,
    products: collectionRaw.products?.map((p: any) => p.toString()) || [],
  };

  return (
    <DashboardPage eyebrow="Catalog" title="Edit Collection">
      <div className="py-6">
        <CollectionForm initialData={initialData} id={id} productsList={productsList} />
      </div>
    </DashboardPage>
  );
}
