"use client";

import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { StatCard } from "@/modules/admin/dashboard/components/StatCard";
import { IndianRupee, Wallet } from "lucide-react";
import { currentVendor } from "@/data/vendors";
import { formatINR } from "@/lib/format";

const payouts = [
  { id: "py1", date: "2025-05-01", amount: 18400, status: "paid" },
  { id: "py2", date: "2025-04-01", amount: 16200, status: "paid" },
  { id: "py3", date: "2025-03-01", amount: 14800, status: "paid" },
  { id: "py4", date: "2025-06-07", amount: currentVendor.payoutsPending, status: "scheduled" },
];

export default function VendorPayoutsPage() {
  return (
    <DashboardPage eyebrow="Finance" title="Payouts">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Pending"
          value={formatINR(currentVendor.payoutsPending)}
          icon={Wallet}
          tint="accent"
        />
        <StatCard label="Paid (YTD)" value={formatINR(76400)} icon={IndianRupee} />
        <StatCard
          label="Lifetime"
          value={formatINR(currentVendor.revenue)}
          icon={IndianRupee}
          tint="brass"
        />
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              {["Date", "Amount", "Status"].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payouts.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-4">{p.date}</td>
                <td className="px-5 py-4 font-semibold">{formatINR(p.amount)}</td>
                <td className="px-5 py-4">
                  <span
                    className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${
                      p.status === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardPage>
  );
}
