"use client";

import { DataTable, StatusBadge, type Column } from "@/modules/admin/shared/components/DataTable";
import { formatINR, formatDate } from "@/lib/format";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  TableSearch,
  TablePagination,
  TableFilter,
} from "@/modules/admin/shared/components/DataTableControls";

export function VendorsClient({ vendors, totalItems }: { vendors: any[]; totalItems: number }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleModerate = async (userId: string, action: "approve" | "suspend" | "reject") => {
    try {
      setLoadingId(userId);
      const res = await fetch("/api/admin/vendors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to moderate vendor");
      }

      toast.success(`Vendor successfully ${action === "approve" ? "approved" : action === "suspend" ? "suspended" : "rejected"}!`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Operation failed.");
    } finally {
      setLoadingId(null);
    }
  };

  const cols: Column<any>[] = [
    {
      key: "n",
      header: "Vendor",
      sortKey: "name",
      render: (v) => (
        <div>
          <p className="font-medium text-sm text-foreground">{v.name}</p>
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
      render: (v) => <span className="text-sm font-semibold text-foreground">{formatINR(v.revenue)}</span>,
    },
    {
      key: "s",
      header: "Status",
      sortKey: "status",
      render: (v) => <StatusBadge status={v.isActive ? "active" : "pending"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (v) => {
        const isPending = !v.isActive;
        return (
          <div className="flex gap-2">
            {isPending ? (
              <>
                <button
                  onClick={() => handleModerate(v.id, "approve")}
                  disabled={loadingId === v.id}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition cursor-pointer disabled:opacity-55"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleModerate(v.id, "reject")}
                  disabled={loadingId === v.id}
                  className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition cursor-pointer disabled:opacity-55"
                >
                  Reject
                </button>
              </>
            ) : (
              <button
                onClick={() => handleModerate(v.id, "suspend")}
                disabled={loadingId === v.id}
                className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition cursor-pointer disabled:opacity-55"
              >
                Suspend
              </button>
            )}
          </div>
        );
      },
    },
  ];

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
