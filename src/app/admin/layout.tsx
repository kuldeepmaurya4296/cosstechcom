import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/modules/admin/dashboard/components/DashboardLayout";
const items = [
  { to: "/admin", label: "Overview", icon: "LayoutDashboard", exact: true },
  { to: "/admin/analytics", label: "Analytics", icon: "BarChart3" },
  { to: "/admin/orders", label: "Orders", icon: "ShoppingCart" },
  { to: "/admin/delivery-partners", label: "Delivery Partners", icon: "Truck" },
  {
    label: "Inventory",
    icon: "Package",
    items: [
      { to: "/admin/inventory/products", label: "Products" },
      { to: "/admin/inventory/brands", label: "Brands" },
      { to: "/admin/inventory/categories", label: "Categories" },
      { to: "/admin/inventory/collections", label: "Collections" },
    ],
  },
  { to: "/admin/coupons", label: "Coupons", icon: "Ticket" },
  { to: "/admin/flash-sales", label: "Flash Sales", icon: "Zap" },
  { to: "/admin/customers", label: "Customers", icon: "Users" },
  { to: "/admin/reviews", label: "Reviews", icon: "MessageSquare" },
  { to: "/admin/vendors", label: "Vendors", icon: "Store" },
  { to: "/admin/disputes", label: "Disputes Mediation", icon: "AlertTriangle" },
  { to: "/admin/reconciliation", label: "Reconciliation", icon: "Coins" },
  { to: "/admin/payouts", label: "Payouts", icon: "Wallet" },
  { to: "/admin/kyc", label: "KYC Verification", icon: "ShieldCheck" },
  { to: "/admin/cms", label: "Website CMS", icon: "Globe" },
  { to: "/admin/settings", label: "Settings", icon: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    redirect("/login");
  }

  return (
    <DashboardLayout items={items} title="Admin Console">
      {children}
    </DashboardLayout>
  );
}
