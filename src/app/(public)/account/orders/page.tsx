"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StatusBadge } from "@/modules/admin/shared/components/DataTable";
import { formatINR, formatDate } from "@/lib/format";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  Package,
  Calendar,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Truck,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  HelpCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { ReturnModal } from "./components/ReturnModal";
import { CancelModal } from "./components/CancelModal";
import { DisputeModal } from "./components/DisputeModal";

const getTimelineSteps = (order: any): string[] => {
  const history = order.statusHistory || [];
  const occurred = history.map((h: any) => h.status);

  const standardOrder = [
    "PLACED",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];
  const currentStatus = order.status || "PLACED";
  const curIdx = standardOrder.indexOf(currentStatus);

  if (curIdx === -1) {
    return occurred;
  }

  const steps = [...occurred];
  for (let i = curIdx + 1; i < standardOrder.length; i++) {
    const futureStep = standardOrder[i];
    if (!steps.includes(futureStep)) {
      steps.push(futureStep);
    }
  }

  return steps;
};

/** Calculate return eligibility for an order */
function getReturnEligibility(order: any): {
  eligible: boolean;
  daysRemaining: number;
  maxReturnDays: number;
  daysElapsed: number;
} {
  if (order.status !== "DELIVERED") {
    return { eligible: false, daysRemaining: 0, maxReturnDays: 0, daysElapsed: 0 };
  }

  const deliveredStep = order.statusHistory?.find((h: any) => h.status === "DELIVERED");
  if (!deliveredStep) {
    return { eligible: false, daysRemaining: 0, maxReturnDays: 0, daysElapsed: 0 };
  }

  const deliveredAt = new Date(deliveredStep.timestamp);
  const diffTime = Math.abs(Date.now() - deliveredAt.getTime());
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const maxReturnDays = (order.items || []).reduce((max: number, item: any) => {
    const itemDays = typeof item.returnDays === "number" ? item.returnDays : 7;
    return itemDays > max ? itemDays : max;
  }, 0);

  const daysRemaining = Math.max(0, maxReturnDays - daysElapsed);
  const eligible = daysElapsed <= maxReturnDays && maxReturnDays > 0;

  return { eligible, daysRemaining, maxReturnDays, daysElapsed };
}

export default function AccountOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "past" | "returns">("active");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [returnModalOrder, setReturnModalOrder] = useState<any>(null);
  const [returnModalDaysLeft, setReturnModalDaysLeft] = useState(0);
  const [cancelModalOrder, setCancelModalOrder] = useState<any>(null);

  // Dispute states
  const [disputes, setDisputes] = useState<any[]>([]);
  const [disputeModalOrder, setDisputeModalOrder] = useState<any>(null);
  const [disputeModalSubOrder, setDisputeModalSubOrder] = useState<any>(null);

  const fetchDisputes = useCallback(() => {
    if (!session?.user?.id) return;
    fetch("/api/orders/dispute")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDisputes(data);
      })
      .catch(console.error);
  }, [session?.user?.id]);

  const fetchOrders = useCallback(() => {
    if (!session?.user?.id) return;
    fetch(`/api/orders?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  useEffect(() => {
    fetchOrders();
    fetchDisputes();
  }, [fetchOrders, fetchDisputes]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const openReturnModal = (order: any, daysRemaining: number) => {
    setReturnModalOrder(order);
    setReturnModalDaysLeft(daysRemaining);
  };

  const closeReturnModal = () => {
    setReturnModalOrder(null);
    setReturnModalDaysLeft(0);
  };

  const handleReturnSuccess = () => {
    closeReturnModal();
    fetchOrders();
  };

  // Categorize orders
  const activeOrders = orders.filter(
    (o) =>
      ![
        "DELIVERED",
        "CANCELLED",
        "RETURN_REQUESTED",
        "RETURN_APPROVED",
        "RETURNED",
        "REFUNDED",
      ].includes(o.status) && !(o.payment?.method !== "COD" && o.payment?.status === "PENDING"),
  );

  const pastPurchases = orders.filter(
    (o) =>
      ["DELIVERED", "CANCELLED"].includes(o.status) &&
      !(o.payment?.method !== "COD" && o.payment?.status === "PENDING"),
  );

  const returnedOrRefunded = orders.filter(
    (o) =>
      ["RETURN_REQUESTED", "RETURN_APPROVED", "RETURNED", "REFUNDED"].includes(o.status) &&
      !(o.payment?.method !== "COD" && o.payment?.status === "PENDING"),
  );

  const getVisibleOrders = () => {
    if (activeTab === "active") return activeOrders;
    if (activeTab === "past") return pastPurchases;
    return returnedOrRefunded;
  };

  const visibleOrders = getVisibleOrders();

  const getActiveTimelineStep = (status: string) => {
    if (status === "PLACED") return 1;
    if (["CONFIRMED", "PACKED"].includes(status)) return 2;
    if (["SHIPPED", "OUT_FOR_DELIVERY"].includes(status)) return 3;
    if (status === "DELIVERED") return 4;
    return 1;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-36 bg-muted rounded-lg"></div>
          <div className="h-5 w-24 bg-muted rounded-full"></div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-4 border-b border-border/60 pb-3">
          <div className="h-5 w-24 bg-muted rounded"></div>
          <div className="h-5 w-24 bg-muted rounded"></div>
          <div className="h-5 w-24 bg-muted rounded"></div>
        </div>

        {[1, 2].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-border/60">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded"></div>
                <div className="h-3 w-20 bg-muted rounded"></div>
              </div>
              <div className="h-6 w-20 bg-muted rounded-full"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-muted shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-muted rounded"></div>
                <div className="h-3 w-32 bg-muted rounded"></div>
              </div>
              <div className="h-4 w-16 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Order History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track, cancel, or request returns for your purchases
          </p>
        </div>
        {orders.length > 0 && (
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full w-fit">
            Total Orders: <strong className="text-foreground">{orders.length}</strong>
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl shadow-sm">
          <div className="h-14 w-14 bg-muted/60 text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-7 w-7" />
          </div>
          <p className="font-serif text-lg font-bold text-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            You haven't placed any orders yet. Discover our premium collections and place
            your first order.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 bg-primary hover:bg-cognac text-primary-foreground rounded-full px-6 py-2.5 text-xs font-bold shadow-md transition-all"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Start Shopping</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Custom Tabs */}
          <div className="flex border-b border-border/60 gap-1 sm:gap-6 overflow-x-auto scrollbar-hide py-1">
            <button
              onClick={() => setActiveTab("active")}
              className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "active"
                  ? "border-primary text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Active Orders</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "active"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {activeOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "past"
                  ? "border-primary text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Past Purchases</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "past"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {pastPurchases.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("returns")}
              className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "returns"
                  ? "border-primary text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Returns & Refunds</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "returns"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {returnedOrRefunded.length}
              </span>
            </button>
          </div>

          {/* Orders List */}
          {visibleOrders.length === 0 ? (
            <div className="text-center py-14 bg-card border border-border/50 rounded-2xl">
              <Package className="h-9 w-9 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground">No orders in this tab</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Any orders matching this status will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {visibleOrders.map((o) => {
                const returnInfo = getReturnEligibility(o);
                const activeTimelineStep = getActiveTimelineStep(o.status);

                return (
                  <div
                    key={o._id || o.id}
                    className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:border-brass/25 transition-all"
                  >
                    {/* Card Header */}
                    <div className="bg-muted/30 border-b border-border/60 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-cream/10 border border-border rounded-xl shrink-0">
                          <Package className="h-5 w-5 text-brass" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm tracking-tight">
                            {o.orderId || o.number}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Ordered {formatDate(o.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={o.status} />
                        <span className="font-serif font-bold text-sm sm:text-base text-cognac">
                          {formatINR(o.pricing?.total || o.total)}
                        </span>
                      </div>
                    </div>

                    {/* Card Body (Products) */}
                    <div className="p-5 space-y-4">
                      {o.items.map((it: any, i: number) => (
                        <div key={i} className="flex gap-4 items-center">
                          {it.image ? (
                            <img
                              src={it.image}
                              alt={it.name}
                              className="h-16 w-16 rounded-xl object-cover border border-border/50 shrink-0"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border/50">
                              <Package className="h-6 w-6 text-muted-foreground/60" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground truncate hover:text-primary transition-colors">
                              {it.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {(() => {
                                const sStr = String(it.size || "").trim();
                                if (!sStr) return "";
                                const num = Number(sStr);
                                const isShoe = !isNaN(num) && num > 0 && num < 20;
                                return `Size: ${isShoe ? "UK/IND " : ""}${sStr} · `;
                              })()}
                              Color: {it.color} · Qty: {it.quantity || it.qty}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold">
                              {formatINR(it.price * (it.quantity || it.qty))}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {formatINR(it.price)} each
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Active Tracker (shown on card directly for in-transit orders) */}
                    {activeTab === "active" && (
                      <div className="px-5 pb-5 pt-2 border-t border-border/40">
                        <div className="max-w-xl mx-auto pt-2">
                          {/* Desktop view: 4-node horizontal timeline */}
                          <div className="hidden sm:block relative">
                            {/* Visual connector line */}
                            <div className="absolute top-4 left-4 right-4 h-1 bg-muted rounded z-0" />
                            <div
                              className="absolute top-4 left-4 h-1 bg-primary rounded z-0 transition-all duration-500"
                              style={{
                                width: `${
                                  activeTimelineStep === 1
                                    ? 0
                                    : activeTimelineStep === 2
                                      ? 33
                                      : activeTimelineStep === 3
                                        ? 66
                                        : 100
                                }%`,
                              }}
                            />

                            <div className="relative z-10 flex justify-between items-center">
                              {/* Node 1: Placed */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                    activeTimelineStep >= 1
                                      ? "bg-primary border-primary text-cream shadow-sm"
                                      : "bg-background border-muted text-muted-foreground"
                                  }`}
                                >
                                  <Calendar className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mt-1">
                                  Placed
                                </span>
                              </div>

                              {/* Node 2: Confirmed/Packed */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                    activeTimelineStep >= 2
                                      ? "bg-primary border-primary text-cream shadow-sm"
                                      : "bg-background border-muted text-muted-foreground"
                                  }`}
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mt-1">
                                  Processing
                                </span>
                              </div>

                              {/* Node 3: Shipped */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                    activeTimelineStep >= 3
                                      ? "bg-primary border-primary text-cream shadow-sm"
                                      : "bg-background border-muted text-muted-foreground"
                                  }`}
                                >
                                  <Truck className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mt-1">
                                  Shipped
                                </span>
                              </div>

                              {/* Node 4: Delivered */}
                              <div className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                    activeTimelineStep >= 4
                                      ? "bg-primary border-primary text-cream shadow-sm"
                                      : "bg-background border-muted text-muted-foreground"
                                  }`}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mt-1">
                                  Delivered
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Mobile view: simple progress bar with current status label */}
                          <div className="sm:hidden space-y-3 pt-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-muted-foreground">
                                Order Progress
                              </span>
                              <span className="font-bold text-primary uppercase tracking-wider">
                                {activeTimelineStep === 1 && "Placed"}
                                {activeTimelineStep === 2 && "Processing"}
                                {activeTimelineStep === 3 && "Shipped"}
                                {activeTimelineStep === 4 && "Delivered"}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{
                                  width: `${
                                    activeTimelineStep === 1
                                      ? 15
                                      : activeTimelineStep === 2
                                        ? 45
                                        : activeTimelineStep === 3
                                          ? 75
                                          : 100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Return eligibility banner or current requested return status */}
                    {o.status === "DELIVERED" &&
                      returnInfo.maxReturnDays > 0 &&
                      (() => {
                        const isRejected = o.statusHistory?.some(
                          (h: any) => h.status === "RETURN_REQUESTED",
                        );
                        if (isRejected) {
                          return (
                            <div className="mx-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="h-4.5 w-4.5 text-red-600 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-bold text-red-800">
                                    Return Request Rejected
                                  </p>
                                  <p className="text-[11px] text-red-700/90 mt-0.5 leading-relaxed font-medium">
                                    Your return request for this order was rejected by our quality
                                    check team. If you have questions, please contact support.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="mx-5 p-3.5 bg-muted/40 border border-border/40 rounded-xl mb-4 flex flex-wrap items-center justify-between gap-3">
                            {returnInfo.eligible ? (
                              <>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                  <span>
                                    Return window:{" "}
                                    <strong className="text-foreground">
                                      {returnInfo.daysRemaining} day
                                      {returnInfo.daysRemaining !== 1 ? "s" : ""} remaining
                                    </strong>{" "}
                                    (expires{" "}
                                    {formatDate(
                                      new Date(
                                        Date.now() + returnInfo.daysRemaining * 24 * 60 * 60 * 1000,
                                      ).toISOString(),
                                    )}
                                    )
                                  </span>
                                </div>
                                <button
                                  onClick={() => openReturnModal(o, returnInfo.daysRemaining)}
                                  className="text-xs font-bold flex items-center gap-1.5 px-4.5 py-2 rounded-full bg-cognac hover:bg-cognac/95 text-white transition-colors cursor-pointer shadow-sm border-0"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  <span>Request Return</span>
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <AlertTriangle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                                <span>
                                  Return policy expired ({returnInfo.maxReturnDays}-day window ended{" "}
                                  {returnInfo.daysElapsed - returnInfo.maxReturnDays} days ago)
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                    {o.status === "RETURN_REQUESTED" && (
                      <div className="mx-5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                        <div className="flex items-start gap-3">
                          <Clock className="h-4.5 w-4.5 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-amber-800">
                              Return Request Under Review
                            </p>
                            <p className="text-[11px] text-amber-700/90 mt-0.5 leading-relaxed font-medium">
                              We have received your return request for this order. Our fulfillment
                              team is processing the request, and we will update you shortly via
                              email.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {o.status === "RETURN_APPROVED" && (
                      <div className="mx-5 p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
                        <div className="flex items-start gap-3">
                          <Clock className="h-4.5 w-4.5 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-blue-800">
                              Return Request Approved (Awaiting Return)
                            </p>
                            <p className="text-[11px] text-blue-700/90 mt-0.5 leading-relaxed font-medium">
                              Your return request has been approved! We are now waiting for the
                              product to be picked up or returned to our warehouse. We will update
                              your refund status once the product is received.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {o.status === "RETURNED" && (
                      <div className="mx-5 p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl mb-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-4.5 w-4.5 text-green-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-green-800">
                              Return Request Approved
                            </p>
                            <p className="text-[11px] text-green-700/90 mt-0.5 leading-relaxed font-medium">
                              Your return request has been approved! The product has been received
                              at our warehouse. We are initiating your refund, which will be
                              processed shortly.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {o.status === "REFUNDED" && (
                      <div className="mx-5 p-3.5 bg-primary/10 border border-primary/20 rounded-xl mb-4">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="h-4.5 w-4.5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-primary">Refund Completed</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
                              A refund of <strong>{formatINR(o.pricing?.total || o.total)}</strong>{" "}
                              has been processed for this order. The amount has been credited back
                              to your account.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Footer (Actions) */}
                    <div className="bg-muted/10 border-t border-border/40 px-5 py-3.5 flex justify-between items-center gap-4">
                      <div className="flex items-center gap-2.5">
                        {(o.status === "PLACED" ||
                          o.status === "CONFIRMED" ||
                          o.status === "PACKED") && (
                          <button
                            onClick={() => setCancelModalOrder(o)}
                            className="text-xs font-bold px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        )}
                        <Link
                          href={`/account/orders/${o._id || o.id}/invoice`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold flex items-center gap-1.5 text-brass hover:text-brass/90 border border-brass/25 hover:border-brass/40 px-4 py-2 rounded-full transition-all cursor-pointer bg-brass/5"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Invoice PDF</span>
                        </Link>
                      </div>

                      <button
                        onClick={() => toggleExpand(o._id || o.id)}
                        className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground hover:text-foreground border border-border px-4 py-2 rounded-full hover:bg-muted transition-all cursor-pointer bg-card"
                      >
                        <span>
                          {expandedOrders[o._id || o.id]
                            ? "Hide Status Details"
                            : "Track / View Details"}
                        </span>
                        {expandedOrders[o._id || o.id] ? (
                          <ChevronUp className="h-3.5 w-3.5 text-brass" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Timeline Expanded Tracking Details */}
                    {expandedOrders[o._id || o.id] && (
                      <div className="bg-muted/20 border-t border-border/40 px-5 py-5 space-y-6">
                        <div className="border-b border-border/40 pb-2.5">
                          <h4 className="text-[10px] uppercase font-bold tracking-wider text-cognac">
                            Seller Packages & Fulfillment
                          </h4>
                        </div>
                        
                        {o.subOrders && o.subOrders.length > 0 ? (
                          <div className="space-y-4">
                            {o.subOrders.map((so: any) => {
                              const disp = disputes.find((d: any) => d.subOrderId === so._id.toString() || d.subOrderId === so.id);
                              const canDispute = ["SHIPPED", "DELIVERED", "OUT_FOR_DELIVERY"].includes(so.status);
                              
                              return (
                                <div key={so.id || so._id} className="bg-card border border-border/60 rounded-xl p-4.5 space-y-3">
                                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/40 pb-2.5">
                                    <div>
                                      <span className="font-mono text-xs font-bold text-charcoal">Package Ref: {so.subOrderId}</span>
                                      <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                                        <span>Status:</span> <StatusBadge status={so.status} />
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2 items-center flex-wrap">
                                      {disp ? (
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                          disp.status === "RESOLVED" || disp.status === "CLOSED"
                                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-100"
                                            : "bg-amber-500/10 text-amber-600 border border-amber-100"
                                        }`}>
                                          Dispute: {disp.status}
                                        </span>
                                      ) : canDispute ? (
                                        <button
                                          onClick={() => {
                                            setDisputeModalOrder(o);
                                            setDisputeModalSubOrder(so);
                                          }}
                                          className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 cursor-pointer transition"
                                        >
                                          Raise Dispute
                                        </button>
                                      ) : null}
                                      
                                      <Link
                                        href={`/account/orders/${o._id || o.id}/invoice?subOrderId=${so.subOrderId}`}
                                        target="_blank"
                                        className="text-[10px] font-bold uppercase tracking-wider text-brass hover:text-brass/90 border border-brass/25 px-3 py-1.5 rounded-lg transition-all cursor-pointer bg-brass/5"
                                      >
                                        Seller Invoice
                                      </Link>
                                    </div>
                                  </div>
                                  
                                  {/* Sub order items list */}
                                  <div className="space-y-2">
                                    {so.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex gap-2.5 items-center text-xs">
                                        <img src={item.image} alt={item.name} className="h-8 w-8 object-cover rounded-lg border border-border shrink-0" />
                                        <div className="min-w-0 flex-1">
                                          <p className="font-semibold text-charcoal truncate">{item.name}</p>
                                          <p className="text-[10px] text-muted-foreground">Size: {item.size} | Color: {item.color} | Qty: {item.qty || item.quantity}</p>
                                        </div>
                                        <span className="font-bold text-charcoal">{formatINR(item.price * (item.qty || item.quantity))}</span>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Shipping Details */}
                                  {so.shipping?.courier && (
                                    <div className="text-[10px] text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/30 flex justify-between items-center flex-wrap gap-2">
                                      <span>Courier: <strong>{so.shipping.courier}</strong> {so.shipping.trackingNumber ? `(AWB: ${so.shipping.trackingNumber})` : ""}</span>
                                      {so.shipping.trackingUrl && (
                                        <a href={so.shipping.trackingUrl} target="_blank" className="text-primary hover:underline font-bold">Track Shipment &rarr;</a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No split vendor packages registered.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Return Request Modal */}
      {returnModalOrder && (
        <ReturnModal
          order={returnModalOrder}
          daysRemaining={returnModalDaysLeft}
          onClose={closeReturnModal}
          onSuccess={handleReturnSuccess}
        />
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <CancelModal
          order={cancelModalOrder}
          onClose={() => setCancelModalOrder(null)}
          onSuccess={() => {
            setCancelModalOrder(null);
            fetchOrders();
          }}
        />
      )}

      {/* Raise Dispute Modal */}
      {disputeModalOrder && disputeModalSubOrder && (
        <DisputeModal
          order={disputeModalOrder}
          subOrder={disputeModalSubOrder}
          onClose={() => {
            setDisputeModalOrder(null);
            setDisputeModalSubOrder(null);
          }}
          onSuccess={() => {
            setDisputeModalOrder(null);
            setDisputeModalSubOrder(null);
            fetchDisputes();
          }}
        />
      )}
    </div>
  );
}
