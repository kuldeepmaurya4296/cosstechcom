import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { FlashSalesClient } from "./FlashSalesClient";

export const dynamic = "force-dynamic";

export default async function AdminFlashSalesPage() {
  return (
    <DashboardPage eyebrow="Marketing" title="Flash Sales Management">
      <FlashSalesClient />
    </DashboardPage>
  );
}
