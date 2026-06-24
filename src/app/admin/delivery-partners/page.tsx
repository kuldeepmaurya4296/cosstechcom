import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { DeliveryPartnersClient } from "./DeliveryPartnersClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DeliveryPartnersPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "vendor")) {
    redirect("/login");
  }

  return (
    <DashboardPage eyebrow="Logistics" title="Delivery Partners & Riders">
      <DeliveryPartnersClient />
    </DashboardPage>
  );
}
