"use client";

import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { DataTable, StatusBadge, type Column } from "@/modules/admin/shared/components/DataTable";
import { ordersByVendor, type Order } from "@/data/orders";
import { currentVendor } from "@/data/vendors";
import { customers } from "@/data/users";
import { formatINR, formatDate } from "@/lib/format";

const cols: Column<Order>[] = [
  {
    key: "n",
    header: "Order",
    render: (o) => <span className="font-semibold text-sm">{o.number}</span>,
  },
  {
    key: "c",
    header: "Customer",
    render: (o) => (
      <span className="text-sm">{customers.find((c) => c.id === o.userId)?.name ?? "—"}</span>
    ),
  },
  {
    key: "i",
    header: "Item",
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

export default function VendorOrdersPage() {
  return (
    <DashboardPage eyebrow="Fulfilment" title="Orders">
      <DataTable columns={cols} rows={ordersByVendor(currentVendor.id)} />
    </DashboardPage>
  );
}
