import { LoyaltyDashboard } from "@/modules/account/components/LoyaltyDashboard";

export const metadata = {
  title: "Loyalty Points | Raja Boot House",
  description: "View and manage your loyalty points ledger balance and transaction logs.",
};

export default function LoyaltyPage() {
  return <LoyaltyDashboard />;
}
