"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { DataTable, StatusBadge, type Column } from "@/modules/admin/shared/components/DataTable";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Truck, Eye, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubOrderItem {
  productId: string;
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  qty: number;
}

interface SubOrder {
  id: string;
  _id: string;
  subOrderId: string;
  parentOrderId: {
    _id: string;
    orderId: string;
    shippingAddress: {
      fullName: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pin: string;
    };
  };
  items: SubOrderItem[];
  status: string;
  pricing: {
    total: number;
  };
  awbNumber?: string;
  createdAt: string;
}

export default function VendorOrdersPage() {
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const router = useRouter();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch sub-orders");
      const data = await res.json();
      setSubOrders(data.map((o: any) => ({ ...o, id: o._id })));
    } catch (err: any) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleBookShipment = async (soId: string) => {
    setBookingId(soId);
    try {
      const res = await fetch("/api/vendor/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subOrderId: soId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to book shipment");
      }

      toast.success(`Shipment booked successfully! Courier: ${data.shippingOrder?.carrier}, AWB: ${data.shippingOrder?.awbNumber}`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Shipment booking failed.");
    } finally {
      setBookingId(null);
    }
  };

  const cols: Column<SubOrder>[] = [
    {
      key: "id",
      header: "Sub-Order ID",
      render: (o) => <span className="font-bold text-sm text-charcoal">{o.subOrderId}</span>,
    },
    {
      key: "parent",
      header: "Parent Order",
      render: (o) => <span className="text-xs text-muted-foreground">{o.parentOrderId?.orderId || "N/A"}</span>,
    },
    {
      key: "items",
      header: "Items",
      render: (o) => (
        <div>
          {o.items.map((item, idx) => (
            <p key={idx} className="text-xs text-charcoal truncate max-w-[200px]">
              {item.name} ({item.qty}x)
            </p>
          ))}
        </div>
      ),
    },
    {
      key: "customer",
      header: "Deliver To",
      render: (o) => {
        const addr = o.parentOrderId?.shippingAddress || {};
        return (
          <div>
            <p className="text-xs font-semibold text-charcoal">{addr.fullName}</p>
            <p className="text-[10px] text-muted-foreground">{addr.city}, {addr.pin}</p>
          </div>
        );
      },
    },
    {
      key: "date",
      header: "Created Date",
      render: (o) => <span className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</span>,
    },
    { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
    {
      key: "total",
      header: "Earnings",
      render: (o) => <span className="font-bold text-charcoal">{formatINR(o.pricing?.total)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (o) => {
        const canShip = ["PLACED", "CONFIRMED", "PACKED"].includes(o.status);
        return (
          <div className="flex gap-2 justify-end">
            {canShip ? (
              <button
                onClick={() => handleBookShipment(o._id)}
                disabled={bookingId !== null}
                className="inline-flex items-center gap-1 bg-charcoal text-cream hover:bg-cognac text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded cursor-pointer transition disabled:opacity-50"
              >
                <Truck className="h-3 w-3" />
                {bookingId === o._id ? "Booking..." : "Book Shipping"}
              </button>
            ) : o.awbNumber ? (
              <div className="text-left text-[10px] text-muted-foreground">
                <span className="font-semibold block text-emerald-600">Shipped</span>
                AWB: {o.awbNumber}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">&mdash;</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DashboardPage eyebrow="Fulfilment" title="Orders Management">
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          Loading vendor sub-orders...
        </div>
      ) : (
        <DataTable columns={cols} rows={subOrders} empty="No sub-orders assigned yet." />
      )}
    </DashboardPage>
  );
}
