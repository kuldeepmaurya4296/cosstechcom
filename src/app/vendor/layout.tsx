import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/modules/admin/dashboard/components/DashboardLayout";
const items = [
  { to: "/vendor", label: "Overview", icon: "LayoutDashboard", exact: true },
  { to: "/vendor/products", label: "My Products", icon: "Package" },
  { to: "/vendor/orders", label: "Orders", icon: "ShoppingCart" },
  { to: "/vendor/payouts", label: "Payouts", icon: "Wallet" },
  { to: "/vendor/reviews", label: "Customer Reviews", icon: "MessageSquare" },
  { to: "/vendor/kyc", label: "KYC Verification", icon: "ShieldCheck" },
  { to: "/vendor/settings", label: "Settings", icon: "Settings" },
];

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (
    !session?.user?.id ||
    ((session.user as any).role !== "vendor" && (session.user as any).role !== "admin")
  ) {
    redirect("/login");
  }

  return (
    <DashboardLayout items={items} title="Vendor Portal" accent="accent">
      {children}
    </DashboardLayout>
  );
}
