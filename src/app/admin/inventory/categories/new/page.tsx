import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { CategoryForm } from "../CategoryForm";

export default function NewCategoryPage() {
  return (
    <DashboardPage eyebrow="Categories" title="New Category">
      <div className="py-6">
        <CategoryForm />
      </div>
    </DashboardPage>
  );
}
