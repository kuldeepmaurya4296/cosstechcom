import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { BrandForm } from "../BrandForm";

export const dynamic = "force-dynamic";

export default function NewBrandPage() {
  return (
    <DashboardPage eyebrow="Catalog" title="New Brand">
      <div className="py-6">
        <BrandForm />
      </div>
    </DashboardPage>
  );
}
