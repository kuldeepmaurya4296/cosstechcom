"use client";

import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { StatCard } from "@/modules/admin/dashboard/components/StatCard";
import { Package, IndianRupee, ShoppingCart, Star } from "lucide-react";
import { currentVendor } from "@/data/vendors";
import { ordersByVendor } from "@/data/orders";
import { products } from "@/data/products";
import { DataTable, StatusBadge, type Column } from "@/modules/admin/shared/components/DataTable";
import type { Order } from "@/data/orders";
import { formatINR, formatDate } from "@/lib/format";

const cols: Column<Order>[] = [
  {
    key: "n",
    header: "Order",
    render: (o) => <span className="font-semibold text-sm">{o.number}</span>,
  },
  {
    key: "i",
    header: "Items",
    render: (o) => <span className="text-sm">{o.items[0]?.name || "—"}</span>,
  },
  {
    key: "d",
    header: "Date",
    render: (o) => <span className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</span>,
  },
  { key: "s", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
  {
    key: "t",
    header: "Total",
    render: (o) => <span className="font-semibold">{formatINR(o.total)}</span>,
    className: "text-right",
  },
];

export default function VendorPage() {
  const v = currentVendor;
  const myOrders = ordersByVendor(v.id);
  const myProducts = products.filter((p) => p.vendorId === v.id);
  return (
    <DashboardPage eyebrow={v.name} title="Workshop overview">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue" value={formatINR(v.revenue)} delta={9.4} icon={IndianRupee} />
        <StatCard
          label="Products"
          value={String(myProducts.length)}
          delta={2.1}
          icon={Package}
          tint="accent"
        />
        <StatCard
          label="Orders"
          value={String(myOrders.length)}
          delta={11.2}
          icon={ShoppingCart}
          tint="brass"
        />
        <StatCard label="Rating" value={`${v.rating}★`} delta={0.3} icon={Star} tint="muted" />
      </div>
      <div className="bg-gradient-to-br from-charcoal to-charcoal/90 text-cream rounded-xl p-6 md:p-8 grid md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2">
          <p className="text-[11px] uppercase tracking-widest text-brass font-semibold">
            Pending payout
          </p>
          <p className="font-serif text-4xl font-bold mt-2">{formatINR(v.payoutsPending)}</p>
          <p className="text-cream/60 text-sm mt-1">Next payout scheduled for 7 June</p>
        </div>
        <button className="bg-brass text-charcoal rounded-full px-5 py-3 text-sm font-bold cursor-pointer">
          Request early payout
        </button>
      </div>
      <div>
        <h3 className="font-serif text-lg font-bold mb-3">Recent orders</h3>
        <DataTable columns={cols} rows={myOrders} />
      </div>
    </DashboardPage>
  );
}
