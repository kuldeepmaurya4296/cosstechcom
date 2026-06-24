"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataTable, StatusBadge, type Column } from "@/modules/admin/shared/components/DataTable";
import { TableSearch, TablePagination } from "@/modules/admin/shared/components/DataTableControls";
import { formatINR, formatDate } from "@/lib/format";
import { Suspense } from "react";
import { useDragScroll } from "@/lib/useDragScroll";
import { UpdateStatusModal } from "./components/UpdateStatusModal";

export function OrdersClient({
  orders,
  totalItems,
  statusCounts = {},
}: {
  orders: any[];
  totalItems: number;
  statusCounts?: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeStatus = searchParams.get("status") || "ALL";
  const dragScroll = useDragScroll();

  const handleTabClick = (statusVal: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (statusVal === "ALL") {
      params.delete("status");
    } else {
      params.set("status", statusVal);
    }
    params.delete("page"); // Reset page when filtering
    router.push(`${pathname}?${params.toString()}`);
  };

  const tabs = [
    { label: "All Orders", value: "ALL" },
    { label: "Placed", value: "PLACED" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Packed", value: "PACKED" },
    { label: "Shipped", value: "SHIPPED" },
    { label: "Out For Delivery", value: "OUT_FOR_DELIVERY" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Return Requested", value: "RETURN_REQUESTED" },
    { label: "Awaiting Return", value: "RETURN_APPROVED" },
    { label: "Returned", value: "RETURNED" },
    { label: "Refunded", value: "REFUNDED" },
  ];

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleOpenUpdateModal = (o: any) => {
    setSelectedOrder(o);
    setIsOpen(true);
  };

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSelectedOnPage =
    orders.length > 0 && orders.every((o) => selectedIds.includes(o.orderId));
  const someSelectedOnPage =
    orders.length > 0 && orders.some((o) => selectedIds.includes(o.orderId));

  const toggleAll = () => {
    if (allSelectedOnPage) {
      setSelectedIds((prev) => prev.filter((id) => !orders.some((o) => o.orderId === id)));
    } else {
      setSelectedIds((prev) => {
        const next = [...prev];
        orders.forEach((o) => {
          if (!next.includes(o.orderId)) {
            next.push(o.orderId);
          }
        });
        return next;
      });
    }
  };

  const cols: Column<any>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={allSelectedOnPage}
          ref={(input) => {
            if (input) {
              input.indeterminate = someSelectedOnPage && !allSelectedOnPage;
            }
          }}
          onChange={toggleAll}
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
        />
      ),
      render: (o) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(o.orderId)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds((prev) => [...prev, o.orderId]);
            } else {
              setSelectedIds((prev) => prev.filter((id) => id !== o.orderId));
            }
          }}
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
        />
      ),
    },
    {
      key: "n",
      header: "Order",
      sortKey: "orderId",
      render: (o) => <span className="font-semibold text-sm">{o.orderId}</span>,
    },
    {
      key: "c",
      header: "Customer",
      render: (o) => <span className="text-sm">{o.customerName}</span>,
    },
    { key: "i", header: "Items", render: (o) => <span className="text-sm">{o.itemCount}</span> },
    {
      key: "p",
      header: "Payment",
      sortKey: "payment",
      render: (o) => <span className="text-sm uppercase text-xs">{o.paymentMethod}</span>,
    },
    {
      key: "d",
      header: "Date",
      sortKey: "createdAt",
      render: (o) => (
        <span className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</span>
      ),
    },
    {
      key: "s",
      header: "Status",
      sortKey: "status",
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: "t",
      header: "Total",
      sortKey: "total",
      render: (o) => <span className="font-semibold">{formatINR(o.total)}</span>,
      className: "text-right",
    },
    {
      key: "actions",
      header: "Actions",
      render: (o) => (
        <button
          onClick={() => handleOpenUpdateModal(o)}
          className="text-xs bg-primary text-primary-foreground hover:bg-primary/95 px-3 py-1.5 rounded-full font-semibold cursor-pointer transition shadow-sm"
        >
          Update Status
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4 relative">
      <div
        ref={dragScroll.ref}
        onMouseDown={dragScroll.onMouseDown}
        onMouseLeave={dragScroll.onMouseLeave}
        onMouseUp={dragScroll.onMouseUp}
        onMouseMove={dragScroll.onMouseMove}
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
            e.preventDefault();
          }
        }}
        style={dragScroll.style}
        className="flex border-b border-border overflow-x-auto scrollbar-hide gap-2 pb-px"
      >
        {tabs.map((tab) => {
          const isActive = activeStatus === tab.value;
          const count = statusCounts[tab.value] || 0;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabClick(tab.value)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap -mb-px cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10 p-4 rounded-xl border border-border">
        <Suspense fallback={null}>
          <TableSearch placeholder="Search order number..." />
        </Suspense>

        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-muted-foreground">
              {selectedIds.length} order{selectedIds.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => {
                window.open(
                  `/api/admin/orders/shipping-labels?ids=${selectedIds.join(",")}`,
                  "_blank",
                );
              }}
              className="text-xs bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2 rounded-full font-bold cursor-pointer transition shadow-sm flex items-center gap-1.5"
            >
              <span>🖨️ Bulk Print Labels</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs bg-background border border-input hover:bg-muted text-muted-foreground hover:text-foreground px-3 py-2 rounded-full font-semibold cursor-pointer transition"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                window.open(`/api/admin/orders/export?${params.toString()}`, "_blank");
              }}
              className="text-xs bg-muted hover:bg-muted/80 text-foreground border border-border px-4 py-2 rounded-full font-semibold cursor-pointer transition shadow-sm flex items-center gap-1.5 w-full sm:w-auto justify-center"
            >
              <span>📥 Export Orders CSV</span>
            </button>
            <button
              onClick={() => {
                window.open("/api/admin/orders/payouts", "_blank");
              }}
              className="text-xs bg-muted hover:bg-muted/80 text-foreground border border-border px-4 py-2 rounded-full font-semibold cursor-pointer transition shadow-sm flex items-center gap-1.5 w-full sm:w-auto justify-center"
            >
              <span>📥 Export Pending Payouts CSV</span>
            </button>
          </div>
        )}
      </div>
      <div>
        <DataTable columns={cols} rows={orders} empty="No orders found." />
        <Suspense fallback={null}>
          <TablePagination totalItems={totalItems} itemsPerPage={10} />
        </Suspense>
      </div>

      {/* Modal Dialog */}
      <UpdateStatusModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedOrder={selectedOrder}
        onSubmitSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
