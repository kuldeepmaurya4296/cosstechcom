"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cart-store";
import { StatusBadge } from "@/modules/admin/shared/components/DataTable";
import { formatINR, formatDate } from "@/lib/format";
import {
  Package,
  Heart,
  MapPin,
  ArrowRight,
  IndianRupee,
  CheckCircle,
  Clock,
  Truck,
  Sparkles,
  ClipboardList,
} from "lucide-react";

export default function AccountOverview() {
  const { data: session } = useSession();
  const { wishlist } = useCart();
  const [stats, setStats] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    Promise.all([
      fetch("/api/user/profile").then((res) => {
        if (!res.ok) throw new Error("Failed to load profile data");
        return res.json();
      }),
      fetch("/api/orders").then((res) => {
        if (!res.ok) throw new Error("Failed to load orders");
        return res.json();
      }),
    ])
      .then(([profileData, ordersData]) => {
        if (profileData.success && profileData.user) {
          setStats(profileData.stats);
          setPhone(profileData.user.phone || "");
        }
        if (Array.isArray(ordersData)) {
          setRecentOrders(ordersData);
        }
      })
      .catch((err) => {
        console.error("Overview page error:", err);
        setError("Something went wrong while loading your dashboard statistics.");
      })
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-7 bg-muted rounded w-1/4 mb-4"></div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 h-[96px]"></div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-6 h-[120px]"></div>
        <div>
          <div className="h-6 w-32 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 h-[88px]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
        <p className="text-sm font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-xs underline font-semibold cursor-pointer"
        >
          Try reloading the page
        </button>
      </div>
    );
  }

  // Calculate profile completion metrics
  let completionPercentage = 0;
  const checklist = [];

  if (session?.user?.name) {
    completionPercentage += 25;
    checklist.push({ label: "Profile name set", complete: true });
  } else {
    checklist.push({ label: "Add profile name", complete: false, href: "/account/profile" });
  }

  if (phone) {
    completionPercentage += 25;
    checklist.push({ label: "Mobile number provided", complete: true });
  } else {
    checklist.push({ label: "Add mobile number", complete: false, href: "/account/profile" });
  }

  if (stats?.savedAddressesCount > 0) {
    completionPercentage += 25;
    checklist.push({ label: "Shipping address saved", complete: true });
  } else {
    checklist.push({ label: "Add delivery address", complete: false, href: "/account/addresses" });
  }

  if (wishlist.length > 0) {
    completionPercentage += 25;
    checklist.push({ label: "Items saved in Wishlist", complete: true });
  } else {
    checklist.push({ label: "Add shoes to wishlist", complete: false, href: "/shop" });
  }

  // Find active orders (in flight)
  const activeOrders = recentOrders.filter(
    (o) => !["DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"].includes(o.status),
  );

  // Helper to determine status progress step
  const getStatusStep = (status: string) => {
    if (status === "PLACED") return 1;
    if (["CONFIRMED", "PACKED"].includes(status)) return 2;
    if (["SHIPPED", "OUT_FOR_DELIVERY"].includes(status)) return 3;
    return 1;
  };

  const statItems = [
    { label: "Total orders", value: stats?.totalOrders ?? 0, icon: Package, color: "text-primary" },
    {
      label: "Total spent",
      value: formatINR(stats?.totalSpent ?? 0),
      icon: IndianRupee,
      color: "text-cognac",
    },
    {
      label: "Saved addresses",
      value: stats?.savedAddressesCount ?? 0,
      icon: MapPin,
      color: "text-brass",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-6 text-foreground">Overview</h2>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        {statItems.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-card border border-border hover:border-brass/20 rounded-xl p-5 flex justify-between items-start transition-all shadow-sm"
            >
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {s.label}
                </p>
                <p className="font-serif text-2xl font-bold mt-2 text-foreground">{s.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl bg-muted/60 ${s.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile Completion Progress Card */}
      {completionPercentage < 100 && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles className="h-24 w-24 text-cognac" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-brass" />
                <h3 className="font-bold text-sm text-foreground">Complete Your Style Profile</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Fill out your account details to personalize checkout and sizing guides.
              </p>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cognac transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-cognac shrink-0">
                  {completionPercentage}% Completed
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:max-w-md">
              {checklist.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    item.complete
                      ? "bg-green-500/10 text-green-700"
                      : "bg-muted/60 text-muted-foreground border border-border/50"
                  }`}
                >
                  <CheckCircle
                    className={`h-3.5 w-3.5 ${item.complete ? "text-green-600" : "text-muted-foreground/35"}`}
                  />
                  {item.complete ? (
                    <span>{item.label}</span>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className="hover:underline font-semibold text-primary"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Orders Trackers */}
      {activeOrders.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-foreground">Active Deliveries</h3>
          <div className="space-y-4">
            {activeOrders.map((o) => {
              const activeStep = getStatusStep(o.status);
              return (
                <div
                  key={o._id || o.id}
                  className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border/40 pb-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Tracking Order
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-sm">{o.orderId}</span>
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                    <div className="text-xs sm:text-right">
                      <p className="text-muted-foreground">
                        Order Date:{" "}
                        <span className="font-semibold text-foreground">
                          {formatDate(o.createdAt)}
                        </span>
                      </p>
                      {o.shipping?.courier && (
                        <p className="text-muted-foreground mt-0.5">
                          Courier:{" "}
                          <span className="font-semibold text-foreground">
                            {o.shipping.courier} ({o.shipping.trackingNumber})
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Visual Timeline Bar */}
                  {/* Desktop view: 3-node horizontal timeline */}
                  <div className="hidden sm:block relative pt-4 pb-2 px-4 max-w-2xl mx-auto">
                    <div className="absolute top-1/2 left-4 right-4 h-1 bg-muted -translate-y-1/2 z-0" />
                    <div
                      className="absolute top-1/2 left-4 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
                      style={{ width: `${activeStep === 1 ? 0 : activeStep === 2 ? 50 : 100}%` }}
                    />

                    <div className="relative z-10 flex justify-between">
                      {/* Step 1: Placed */}
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                            activeStep >= 1
                              ? "bg-primary border-primary text-cream"
                              : "bg-card border-muted text-muted-foreground"
                          }`}
                        >
                          <ClipboardList className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
                          Placed
                        </span>
                      </div>

                      {/* Step 2: Confirmed/Packed */}
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                            activeStep >= 2
                              ? "bg-primary border-primary text-cream"
                              : "bg-card border-muted text-muted-foreground"
                          }`}
                        >
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
                          Processing
                        </span>
                      </div>

                      {/* Step 3: Shipped */}
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                            activeStep >= 3
                              ? "bg-primary border-primary text-cream"
                              : "bg-card border-muted text-muted-foreground"
                          }`}
                        >
                          <Truck className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
                          In Transit
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile view: simple progress bar with current status label */}
                  <div className="sm:hidden space-y-3 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-muted-foreground">Delivery Status</span>
                      <span className="font-bold text-primary uppercase tracking-wider">
                        {activeStep === 1 && "Placed"}
                        {activeStep === 2 && "Processing"}
                        {activeStep >= 3 && "In Transit"}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${activeStep === 1 ? 15 : activeStep === 2 ? 50 : 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Orders List */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-serif text-lg font-bold text-foreground">Recent orders</h2>
          {recentOrders.length > 0 && (
            <Link
              href="/account/orders"
              className="text-xs font-bold text-primary hover:text-cognac underline"
            >
              View all orders
            </Link>
          )}
        </div>
        {recentOrders.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
            <p className="text-sm font-semibold">You haven't placed any orders yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Browse our collection to purchase shoes.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block bg-primary hover:bg-cognac text-primary-foreground rounded-full px-6 py-2.5 text-xs font-semibold shadow-sm transition-all"
            >
              Browse shop
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.slice(0, 3).map((o) => {
              const firstItem = o.items?.[0];
              return (
                <Link
                  key={o._id || o.id}
                  href="/account/orders"
                  className="bg-card border border-border hover:border-brass/30 rounded-xl p-4 flex items-center gap-4 transition-all hover:shadow-sm"
                >
                  {firstItem?.image ? (
                    <img
                      src={firstItem.image}
                      alt={firstItem.name}
                      className="h-14 w-14 rounded-lg object-cover border border-border/40 shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{o.orderId}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(o.createdAt)} · {o.items?.length || 0}{" "}
                      {o.items?.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-serif font-bold text-cognac text-sm">
                      {formatINR(o.pricing?.total || o.total || 0)}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-primary font-bold mt-1 justify-end hover:underline">
                      <span>Details</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
