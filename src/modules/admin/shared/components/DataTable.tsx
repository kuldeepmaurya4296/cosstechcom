"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useDragScroll } from "@/lib/useDragScroll";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  sortKey?: string;
}

function DataTableInner<T extends { id: string }>({
  columns,
  rows,
  empty = "No records",
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dragScroll = useDragScroll();

  const currentSort = searchParams.get("sort") || "";
  const currentOrder = searchParams.get("order") || "desc";

  const handleSort = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSort === key) {
      if (currentOrder === "asc") {
        params.set("order", "desc");
      } else {
        params.delete("sort");
        params.delete("order");
      }
    } else {
      params.set("sort", key);
      params.set("order", "asc");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
      <div
        ref={dragScroll.ref}
        onMouseDown={dragScroll.onMouseDown}
        onMouseLeave={dragScroll.onMouseLeave}
        onMouseUp={dragScroll.onMouseUp}
        onMouseMove={dragScroll.onMouseMove}
        style={dragScroll.style}
        className="overflow-x-auto"
      >
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-muted/60">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground px-5 py-3 ${c.className ?? ""}`}
                >
                  {c.sortKey ? (
                    <button
                      onClick={() => handleSort(c.sortKey!)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {c.header}
                      {currentSort === c.sortKey ? (
                        currentOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-5 py-4 align-middle ${c.className ?? ""}`}>
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { Suspense } from "react";
export function DataTable<T extends { id: string }>(props: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="h-64 border border-border rounded-xl bg-card animate-pulse shadow-card"></div>
      }
    >
      <DataTableInner {...props} />
    </Suspense>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "").toLowerCase().replace(/_/g, " ");
  const map: Record<string, string> = {
    delivered: "bg-emerald-100 text-emerald-800",
    returned: "bg-orange-100 text-orange-800",
    "return requested": "bg-yellow-100 text-yellow-800",
    shipped: "bg-blue-100 text-blue-800",
    "out for delivery": "bg-indigo-100 text-indigo-800",
    processing: "bg-amber-100 text-amber-900",
    packed: "bg-purple-100 text-purple-800",
    confirmed: "bg-cyan-100 text-cyan-800",
    placed: "bg-sky-100 text-sky-800",
    pending: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/15 text-destructive",
    refunded: "bg-teal-100 text-teal-800",
    active: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${map[normalized] ?? "bg-muted"}`}
    >
      {normalized}
    </span>
  );
}
