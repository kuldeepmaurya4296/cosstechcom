"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { StatCard } from "@/modules/admin/dashboard/components/StatCard";
import { DataTable, StatusBadge, type Column } from "@/modules/admin/shared/components/DataTable";
import { ShoppingCart, IndianRupee, Users, Package, AlertTriangle } from "lucide-react";
import { formatINR, formatDate, formatNumber } from "@/lib/format";
import { SalesChart } from "@/modules/admin/dashboard/components/SalesChart";
import { TopProductsList } from "@/modules/admin/dashboard/components/TopProductsList";

const cols: Column<any>[] = [
  {
    key: "orderId",
    header: "Order",
    render: (o) => <span className="font-semibold text-sm">{o.orderId || o.number}</span>,
  },
  {
    key: "customerName",
    header: "Customer",
    render: (o) => <span className="text-sm">{o.customerName || "—"}</span>,
  },
  {
    key: "createdAt",
    header: "Date",
    render: (o) => <span className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</span>,
  },
  { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
  {
    key: "total",
    header: "Total",
    render: (o) => <span className="font-semibold">{formatINR(o.total)}</span>,
    className: "text-right",
  },
];

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard metrics", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <DashboardPage eyebrow="Overview" title="Dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardPage>
    );
  }

  const {
    revenue = 0,
    ordersCount = 0,
    customersCount = 0,
    productsCount = 0,
    salesChart = { data: [0], labels: [""] },
    latestOrders = [],
    topProducts = [],
    lowStockAlerts = [],
  } = stats || {};

  return (
    <DashboardPage eyebrow="Today" title="Overview">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenue"
          value={formatINR(revenue)}
          delta={stats?.revenueDelta ?? 0}
          icon={IndianRupee}
          tint="primary"
        />
        <StatCard
          label="Orders"
          value={formatNumber(ordersCount)}
          delta={stats?.ordersDelta ?? 0}
          icon={ShoppingCart}
          tint="accent"
        />
        <StatCard
          label="Customers"
          value={formatNumber(customersCount)}
          delta={stats?.customersDelta ?? 0}
          icon={Users}
          tint="brass"
        />
        <StatCard
          label="Products"
          value={formatNumber(productsCount)}
          delta={stats?.productsDelta ?? 0}
          icon={Package}
          tint="muted"
        />
      </div>

      {/* Active Processing Funnel */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-serif font-bold text-lg text-foreground">
            Order Fulfillment Pipeline
          </h3>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
            Real-time Queues
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Active order queues waiting for processing actions
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/40 p-4 rounded-xl border border-border/50 flex justify-between items-center hover:shadow-inner transition-all">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Pending Confirmation
              </span>
              <p className="text-2xl font-bold font-serif text-cognac mt-1">
                {stats?.placedQueue ?? 0} Orders
              </p>
            </div>
            <span className="text-xs font-bold bg-cognac/10 text-cognac px-2.5 py-1 rounded-full">
              Placed
            </span>
          </div>
          <div className="bg-muted/40 p-4 rounded-xl border border-border/50 flex justify-between items-center hover:shadow-inner transition-all">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Ready to Dispatch
              </span>
              <p className="text-2xl font-bold font-serif text-brass mt-1">
                {stats?.readyToShipQueue ?? 0} Orders
              </p>
            </div>
            <span className="text-xs font-bold bg-brass/10 text-brass px-2.5 py-1 rounded-full">
              Confirmed/Packed
            </span>
          </div>
          <div className="bg-muted/40 p-4 rounded-xl border border-border/50 flex justify-between items-center hover:shadow-inner transition-all">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                In Transit
              </span>
              <p className="text-2xl font-bold font-serif text-primary mt-1">
                {stats?.inTransitQueue ?? 0} Orders
              </p>
            </div>
            <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              Shipped/Delivery
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Sales trend Area chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg mb-1">Sales this week</h3>
            <p className="text-xs text-muted-foreground mb-6">Daily revenue trend, last 7 days</p>
          </div>
          <SalesChart data={salesChart.data} labels={salesChart.labels} />
        </div>

        {/* Top products & low stock registry */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg mb-4">Top products</h3>
            <TopProductsList products={topProducts} />
          </div>

          {lowStockAlerts.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-destructive mb-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Low Stock Registry</h4>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                {lowStockAlerts.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-xs bg-destructive/5 hover:bg-destructive/10 p-2.5 rounded-lg border border-destructive/15 transition-colors"
                  >
                    <span className="font-semibold text-foreground/80 truncate max-w-[180px]">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-destructive">{item.stock} left</span>
                      <a
                        href={`/admin/inventory/products/${item.id}/edit`}
                        className="text-[10px] font-bold text-primary hover:text-cognac underline shrink-0 cursor-pointer"
                      >
                        Refill
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-serif text-lg font-bold">Latest orders</h3>
        </div>
        <DataTable columns={cols} rows={latestOrders} />
      </div>
    </DashboardPage>
  );
}
