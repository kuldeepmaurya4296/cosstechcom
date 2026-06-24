import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { CategoryForm } from "../../CategoryForm";
import { connectToDatabase as dbConnect } from "@/lib/db";
import Category from "@/lib/models/Category";
import { notFound } from "next/navigation";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const cat = await Category.findById(id).lean();

  if (!cat) {
    notFound();
  }

  const initialData = {
    name: cat.name,
    slug: cat.slug,
    description: cat.description || "",
    isActive: cat.isActive,
    imageUrl: cat.imageUrl || "",
  };

  return (
    <DashboardPage eyebrow="Categories" title="Edit Category">
      <div className="py-6">
        <CategoryForm initialData={initialData} id={id} />
      </div>
    </DashboardPage>
  );
}
