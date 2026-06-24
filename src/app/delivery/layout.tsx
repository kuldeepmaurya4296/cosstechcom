import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/modules/admin/dashboard/components/DashboardLayout";

const items = [
  { to: "/delivery", label: "My Shipments", icon: "Truck", exact: true },
];

export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (
    !session?.user?.id ||
    ((session.user as any).role !== "delivery_partner" && (session.user as any).role !== "admin")
  ) {
    redirect("/login");
  }

  return (
    <DashboardLayout items={items} title="Delivery Portal" accent="accent">
      {children}
    </DashboardLayout>
  );
}
