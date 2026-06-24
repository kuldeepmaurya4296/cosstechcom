import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { CouponsClient } from "./CouponsClient";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  return (
    <DashboardPage eyebrow="Marketing" title="Coupons Management">
      <CouponsClient />
    </DashboardPage>
  );
}
