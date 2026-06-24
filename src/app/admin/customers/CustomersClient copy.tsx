"use client";

import { DataTable, type Column } from "@/modules/admin/shared/components/DataTable";
import { formatINR, formatDate } from "@/lib/format";
import { Suspense } from "react";
import { TableSearch, TablePagination } from "@/modules/admin/shared/components/DataTableControls";

const cols: Column<any>[] = [
  {
    key: "n",
    header: "Customer",
    sortKey: "name",
    render: (u) => (
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
          {u.name
            ? u.name
                .split(" ")
                .map((p: string) => p[0])
                .join("")
            : "?"}
        </div>
        <div>
          <p className="font-medium text-sm">{u.name || "Unknown"}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "j",
    header: "Joined",
    sortKey: "joinedAt",
    render: (u) => <span className="text-sm text-muted-foreground">{formatDate(u.joinedAt)}</span>,
  },
  {
    key: "o",
    header: "Orders",
    sortKey: "orders",
    render: (u) => <span className="text-sm font-semibold">{u.orders}</span>,
  },
  {
    key: "s",
    header: "Spent",
    sortKey: "totalSpent",
    render: (u) => <span className="text-sm font-semibold">{formatINR(u.totalSpent)}</span>,
    className: "text-right",
  },
];

export function CustomersClient({
  customers,
  totalItems,
}: {
  customers: any[];
  totalItems: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Suspense fallback={null}>
          <TableSearch placeholder="Search name or email..." />
        </Suspense>
      </div>
      <div>
        <DataTable columns={cols} rows={customers} empty="No customers found." />
        <Suspense fallback={null}>
          <TablePagination totalItems={totalItems} itemsPerPage={10} />
        </Suspense>
      </div>
    </div>
  );
}
