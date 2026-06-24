import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/modules/admin/dashboard/components/DashboardLayout";

const items = [
  { to: "/support", label: "Mediation Center", icon: "MessageSquare", exact: true },
];

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (
    !session?.user?.id ||
    ((session.user as any).role !== "support" && (session.user as any).role !== "admin")
  ) {
    redirect("/login");
  }

  return (
    <DashboardLayout items={items} title="Support Center" accent="primary">
      {children}
    </DashboardLayout>
  );
}
