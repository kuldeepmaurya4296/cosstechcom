"use client";

import { DataTable, StatusBadge, type Column } from "@/modules/admin/shared/components/DataTable";
import { formatINR, formatDate } from "@/lib/format";
import { Suspense } from "react";
import {
  TableSearch,
  TablePagination,
  TableFilter,
} from "@/modules/admin/shared/components/DataTableControls";

const cols: Column<any>[] = [
  {
    key: "n",
    header: "Vendor",
    sortKey: "name",
    render: (v) => (
      <div>
        <p className="font-medium text-sm">{v.name}</p>
        <p className="text-xs text-muted-foreground">{v.email}</p>
      </div>
    ),
  },
  {
    key: "j",
    header: "Joined",
    sortKey: "joinedAt",
    render: (v) => <span className="text-sm text-muted-foreground">{formatDate(v.joinedAt)}</span>,
  },
  {
    key: "p",
    header: "Products",
    sortKey: "productsCount",
    render: (v) => <span className="text-sm">{v.productsCount}</span>,
  },
  {
    key: "r",
    header: "Revenue",
    sortKey: "revenue",
    render: (v) => <span className="text-sm font-semibold">{formatINR(v.revenue)}</span>,
  },
  {
    key: "s",
    header: "Status",
    sortKey: "status",
    render: (v) => <StatusBadge status={v.isActive ? "active" : "pending"} />,
  },
];

export function VendorsClient({ vendors, totalItems }: { vendors: any[]; totalItems: number }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Suspense fallback={null}>
          <TableSearch placeholder="Search vendor name..." />
        </Suspense>
        <Suspense fallback={null}>
          <TableFilter
            filterKey="status"
            options={[
              { label: "Active", value: "active" },
              { label: "Pending", value: "pending" },
            ]}
          />
        </Suspense>
      </div>
      <div>
        <DataTable columns={cols} rows={vendors} empty="No vendors found." />
        <Suspense fallback={null}>
          <TablePagination totalItems={totalItems} itemsPerPage={10} />
        </Suspense>
      </div>
    </div>
  );
}
