import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { BrandForm } from "../../BrandForm";
import { connectToDatabase as dbConnect } from "@/lib/db";
import Brand from "@/lib/models/Brand";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;

  const brand = await Brand.findById(id).lean();

  if (!brand) {
    notFound();
  }

  const initialData = {
    name: brand.name,
    imageUrl: brand.imageUrl || "",
    order: brand.order || 0,
    isActive: brand.isActive,
  };

  return (
    <DashboardPage eyebrow="Catalog" title="Edit Brand">
      <div className="py-6">
        <BrandForm initialData={initialData} id={id} />
      </div>
    </DashboardPage>
  );
}
