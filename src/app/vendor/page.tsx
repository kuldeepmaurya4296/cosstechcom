"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { StatCard } from "@/modules/admin/dashboard/components/StatCard";
import { Package, IndianRupee, ShoppingCart, Star } from "lucide-react";
import { DataTable, StatusBadge, type Column } from "@/modules/admin/shared/components/DataTable";
import { formatINR, formatDate, formatNumber } from "@/lib/format";
import { toast } from "sonner";
import Link from "next/link";

const cols: Column<any>[] = [
  {
    key: "subOrderId",
    header: "Sub Order",
    render: (o) => <span className="font-semibold text-sm">{o.subOrderId}</span>,
  },
  {
    key: "parentOrderSeqId",
    header: "Parent Order ID",
    render: (o) => <span className="text-sm">{o.parentOrderSeqId}</span>,
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

export default function VendorPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load vendor dashboard", err);
        setLoading(false);
      });
  }, []);

  const handleRequestPayout = () => {
    toast.success("Redirecting to withdrawals portal...");
  };

  if (loading) {
    return (
      <DashboardPage eyebrow="Seller Portal" title="Overview">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardPage>
    );
  }

  const {
    revenue = 0,
    productsCount = 0,
    ordersCount = 0,
    rating = 4.5,
    payoutsPending = 0,
    latestOrders = [],
    placedQueue = 0,
    readyToShipQueue = 0,
    inTransitQueue = 0,
  } = stats || {};

  return (
    <DashboardPage eyebrow="Seller Portal" title="Overview">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Earnings" value={formatINR(revenue)} icon={IndianRupee} tint="primary" />
        <StatCard
          label="Catalog Products"
          value={formatNumber(productsCount)}
          icon={Package}
          tint="accent"
        />
        <StatCard
          label="Total Orders"
          value={formatNumber(ordersCount)}
          icon={ShoppingCart}
          tint="brass"
        />
        <StatCard label="Rating" value={`${rating}★`} icon={Star} tint="muted" />
      </div>

      {/* Payout & Withdraw Card */}
      <div className="bg-gradient-to-br from-charcoal to-charcoal/90 text-cream rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-border/10 shadow-lg">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brass font-bold">
            Available Wallet Balance
          </p>
          <p className="font-serif text-4xl font-black mt-2">{formatINR(payoutsPending)}</p>
          <p className="text-cream/50 text-xs mt-1">Request early payout withdrawals anytime.</p>
        </div>
        <Link
          href="/vendor/payouts"
          onClick={handleRequestPayout}
          className="bg-brass text-charcoal hover:bg-brass/90 px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md inline-block"
        >
          Withdraw Funds
        </Link>
      </div>

      {/* Order Fulfillment Pipeline */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-serif font-bold text-lg text-foreground">
            Fulfillment Dashboard
          </h3>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
            Order Queues
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Monitor your pending shipments and active deliveries
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/40 p-4 rounded-xl border border-border/50 flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Incoming Orders
              </span>
              <p className="text-2xl font-bold font-serif text-cognac mt-1">
                {placedQueue} Orders
              </p>
            </div>
            <span className="text-xs font-bold bg-cognac/10 text-cognac px-2.5 py-1 rounded-full">
              Placed
            </span>
          </div>
          <div className="bg-muted/40 p-4 rounded-xl border border-border/50 flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Pending Shipments
              </span>
              <p className="text-2xl font-bold font-serif text-brass mt-1">
                {readyToShipQueue} Orders
              </p>
            </div>
            <span className="text-xs font-bold bg-brass/10 text-brass px-2.5 py-1 rounded-full">
              Confirm / Pack
            </span>
          </div>
          <div className="bg-muted/40 p-4 rounded-xl border border-border/50 flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                In Transit
              </span>
              <p className="text-2xl font-bold font-serif text-primary mt-1">
                {inTransitQueue} Orders
              </p>
            </div>
            <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              Shipped
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders list */}
      <div>
        <h3 className="font-serif text-lg font-bold mb-3">Recent Orders</h3>
        <DataTable columns={cols} rows={latestOrders} />
      </div>
    </DashboardPage>
  );
}
