"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { StatCard } from "@/modules/admin/dashboard/components/StatCard";
import { Truck, CheckCircle2, ClipboardList, ScanLine, Phone, MapPin, IndianRupee, Eye, AlertCircle } from "lucide-react";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";

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
  _id: string;
  subOrderId: string;
  parentOrderId: string;
  parentOrderSeqId: string;
  vendorId: string;
  items: SubOrderItem[];
  status: string;
  pricing: {
    total: number;
  };
  createdAt: string;
  updatedAt: string;
  shipping: {
    courier?: string;
    trackingNumber?: string;
    deliveryPartnerId?: string;
  };
  parentOrder?: {
    shippingAddress: {
      fullName: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pin: string;
      phone: string;
    };
    payment: {
      method: string;
      status: string;
    };
  };
}

export default function DeliveryPartnerPage() {
  const [assignedOrders, setAssignedOrders] = useState<SubOrder[]>([]);
  const [unclaimedOrders, setUnclaimedOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "unclaimed" | "completed">("active");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  const fetchDeliveries = async () => {
    try {
      const res = await fetch("/api/delivery");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setAssignedOrders(data.assigned || []);
      setUnclaimedOrders(data.unclaimed || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load delivery records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleClaimOrder = async (subOrderId: string) => {
    try {
      setUpdatingId(subOrderId);
      const res = await fetch("/api/delivery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subOrderId,
          action: "claim",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to claim");
      }

      toast.success("Package claimed successfully!");
      fetchDeliveries();
    } catch (err: any) {
      toast.error(err.message || "Could not claim package.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStatus = async (subOrderId: string, status: "DELIVERED" | "CANCELLED", otp?: string) => {
    try {
      setUpdatingId(subOrderId);
      const note = noteInput[subOrderId] || "";
      const res = await fetch("/api/delivery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subOrderId,
          action: "update_status",
          status,
          note: note || `Delivery updated to ${status} by partner.`,
          deliveryOtp: otp,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update status");
      }

      toast.success(`Marked as ${status === "DELIVERED" ? "Delivered" : "Delivery Failed"}!`);
      // Clear note input
      setNoteInput((prev) => ({ ...prev, [subOrderId]: "" }));
      fetchDeliveries();
    } catch (err: any) {
      toast.error(err.message || "Failed to update package status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendOtp = async (subOrderId: string) => {
    try {
      const res = await fetch("/api/delivery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subOrderId,
          action: "send_otp",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to send OTP");
      }

      toast.success("Delivery verification OTP sent! Check console / server logs.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send delivery OTP.");
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    // Check unclaimed first
    const unclaimed = unclaimedOrders.find(
      (o) => o.subOrderId.toLowerCase() === barcodeInput.trim().toLowerCase()
    );
    if (unclaimed) {
      handleClaimOrder(unclaimed._id);
      setBarcodeInput("");
      return;
    }

    // Check active
    const active = assignedOrders.find(
      (o) => o.subOrderId.toLowerCase() === barcodeInput.trim().toLowerCase() && o.status === "OUT_FOR_DELIVERY"
    );
    if (active) {
      setActiveTab("active");
      toast.info(`Package ${barcodeInput} is already in your Active list.`);
      setBarcodeInput("");
      return;
    }

    toast.error("Package not found or ineligible for action.");
    setBarcodeInput("");
  };

  if (loading) {
    return (
      <DashboardPage eyebrow="Logistics" title="Delivery Operations">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardPage>
    );
  }

  // Filter lists
  const activeDeliveries = assignedOrders.filter((o) => o.status === "OUT_FOR_DELIVERY");
  const completedDeliveries = assignedOrders.filter(
    (o) => o.status === "DELIVERED" || o.status === "CANCELLED" || o.status === "RETURNED" || o.status === "REFUNDED"
  );

  return (
    <DashboardPage eyebrow="Logistics" title="Delivery Operations">
      {/* Quick Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Deliveries"
          value={activeDeliveries.length.toString()}
          icon={Truck}
          tint="primary"
        />
        <StatCard
          label="Unclaimed Packages"
          value={unclaimedOrders.length.toString()}
          icon={ClipboardList}
          tint="accent"
        />
        <StatCard
          label="Completed Packages"
          value={completedDeliveries.length.toString()}
          icon={CheckCircle2}
          tint="brass"
        />
      </div>

      {/* Barcode Check-In Simulator */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ScanLine className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="font-serif font-bold text-base text-foreground">
            Barcode Scan / Sub-Order Check-In
          </h3>
        </div>
        <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Scan barcode or enter Sub-Order ID (e.g. SUB-00001)..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            className="flex-1 bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
          <button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer transition shadow"
          >
            Check-In
          </button>
        </form>
      </div>

      {/* Tab Control */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 text-sm font-semibold relative transition cursor-pointer ${
            activeTab === "active" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Deliveries ({activeDeliveries.length})
        </button>
        <button
          onClick={() => setActiveTab("unclaimed")}
          className={`pb-3 text-sm font-semibold relative transition cursor-pointer ${
            activeTab === "unclaimed" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Unclaimed Pool ({unclaimedOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-3 text-sm font-semibold relative transition cursor-pointer ${
            activeTab === "completed" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Completed Logs ({completedDeliveries.length})
        </button>
      </div>

      {/* Sub-orders List Rendering */}
      <div className="space-y-4">
        {activeTab === "active" && (
          <>
            {activeDeliveries.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                <Truck className="h-10 w-10 mx-auto mb-2 opacity-40 text-muted-foreground" />
                <p className="text-sm font-medium">No packages out for delivery.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Claim packages from the unclaimed pool to begin.</p>
              </div>
            ) : (
              activeDeliveries.map((subOrder) => (
                <DeliveryCard
                  key={subOrder._id}
                  subOrder={subOrder}
                  isUpdating={updatingId === subOrder._id}
                  noteValue={noteInput[subOrder._id] || ""}
                  onNoteChange={(val) => setNoteInput((prev) => ({ ...prev, [subOrder._id]: val }))}
                  onStatusUpdate={(status, otp) => handleUpdateStatus(subOrder._id, status, otp)}
                  onSendOtp={() => handleSendOtp(subOrder._id)}
                  type="active"
                />
              ))
            )}
          </>
        )}

        {activeTab === "unclaimed" && (
          <>
            {unclaimedOrders.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-40 text-muted-foreground" />
                <p className="text-sm font-medium">No unclaimed packages available.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Vendors have not marked any shipments as ready yet.</p>
              </div>
            ) : (
              unclaimedOrders.map((subOrder) => (
                <DeliveryCard
                  key={subOrder._id}
                  subOrder={subOrder}
                  isUpdating={updatingId === subOrder._id}
                  onClaim={() => handleClaimOrder(subOrder._id)}
                  type="unclaimed"
                />
              ))
            )}
          </>
        )}

        {activeTab === "completed" && (
          <>
            {completedDeliveries.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-40 text-muted-foreground" />
                <p className="text-sm font-medium">No delivery logs found.</p>
              </div>
            ) : (
              completedDeliveries.map((subOrder) => (
                <DeliveryCard
                  key={subOrder._id}
                  subOrder={subOrder}
                  type="completed"
                />
              ))
            )}
          </>
        )}
      </div>
    </DashboardPage>
  );
}

// Sub-component for individual delivery card
function DeliveryCard({
  subOrder,
  isUpdating,
  noteValue,
  onNoteChange,
  onStatusUpdate,
  onClaim,
  onSendOtp,
  type,
}: {
  subOrder: SubOrder;
  isUpdating?: boolean;
  noteValue?: string;
  onNoteChange?: (val: string) => void;
  onStatusUpdate?: (status: "DELIVERED" | "CANCELLED", otp?: string) => void;
  onClaim?: () => void;
  onSendOtp?: () => void;
  type: "active" | "unclaimed" | "completed";
}) {
  const [otpVal, setOtpVal] = useState("");
  const address = subOrder.parentOrder?.shippingAddress;
  const payment = subOrder.parentOrder?.payment;
  const isCod = payment?.method === "COD";

  return (
    <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition duration-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border/50 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-foreground">
              {subOrder.subOrderId}
            </span>
            <span className="text-[10px] text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded font-mono">
              PARENT ID: {subOrder.parentOrderSeqId}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                subOrder.status === "DELIVERED"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : subOrder.status === "CANCELLED"
                  ? "bg-red-500/10 text-red-600"
                  : subOrder.status === "OUT_FOR_DELIVERY"
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-blue-500/10 text-blue-600"
              }`}
            >
              {subOrder.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Registered: {formatDate(subOrder.createdAt)}
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-xs text-muted-foreground">Order Value</p>
          <p className="font-serif text-lg font-bold text-cognac">
            {formatINR(subOrder.pricing.total)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
        {/* Customer Address Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            <MapPin className="h-3.5 w-3.5" />
            <span>Shipping Address</span>
          </div>
          {address ? (
            <div className="text-xs space-y-1">
              <p className="font-bold text-foreground">{address.fullName}</p>
              <p className="text-muted-foreground leading-relaxed">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} - {address.pin}
              </p>
              <div className="flex items-center gap-1 mt-2 text-primary font-semibold">
                <Phone className="h-3 w-3" />
                <a href={`tel:${address.phone}`} className="hover:underline">
                  {address.phone}
                </a>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Address metadata missing</p>
          )}
        </div>

        {/* Payment & Items List */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            <IndianRupee className="h-3.5 w-3.5" />
            <span>Fulfillment Details</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-muted/40 p-2.5 rounded-lg border border-border/40">
              <span className="font-medium">Method:</span>
              <span className="font-bold text-foreground">{payment?.method || "Prepaid"}</span>
            </div>
            <div className="flex justify-between items-center bg-muted/40 p-2.5 rounded-lg border border-border/40">
              <span className="font-medium">COD Collection:</span>
              {isCod ? (
                <span className="font-extrabold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded animate-pulse">
                  Collect {formatINR(subOrder.pricing.total)}
                </span>
              ) : (
                <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                  PAID (Online)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Package Items */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            <Eye className="h-3.5 w-3.5" />
            <span>Items ({subOrder.items.length})</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
            {subOrder.items.map((item, idx) => (
              <div key={idx} className="flex gap-2.5 items-center text-xs">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-8 w-8 object-cover rounded-lg border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Size: {item.size} | Color: {item.color} | Qty: {item.qty}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {type === "unclaimed" && onClaim && (
        <div className="border-t border-border/50 pt-4 flex justify-end">
          <button
            onClick={onClaim}
            disabled={isUpdating}
            className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer transition shadow flex items-center gap-2 disabled:opacity-55"
          >
            <Truck className="h-4 w-4" />
            {isUpdating ? "Claiming..." : "Claim for Delivery"}
          </button>
        </div>
      )}

      {type === "active" && onStatusUpdate && onNoteChange && (
        <div className="border-t border-border/50 pt-4 space-y-4">
          {/* COD collection notice & OTP fields */}
          {isCod && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 block">COD SECURE VERIFICATION REQUIRED</span>
                <p className="text-xs text-amber-700 font-medium mt-1">Collect cash: <strong className="text-red-700 font-bold font-serif text-sm">{formatINR(subOrder.pricing.total)}</strong> before OTP verify.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto items-center">
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP..."
                  value={otpVal}
                  onChange={(e) => setOtpVal(e.target.value)}
                  className="bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none w-32 font-bold tracking-widest text-center"
                />
                {onSendOtp && (
                  <button
                    onClick={onSendOtp}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg cursor-pointer transition whitespace-nowrap"
                  >
                    Send OTP
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="text"
              placeholder="Add delivery note / proof details (e.g. Delivered to reception, customer refused)..."
              value={noteValue}
              onChange={(e) => onNoteChange(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                onClick={() => onStatusUpdate("CANCELLED")}
                disabled={isUpdating}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer transition flex-1 sm:flex-none disabled:opacity-55"
              >
                Failed
              </button>
              <button
                onClick={() => onStatusUpdate("DELIVERED", isCod ? otpVal : undefined)}
                disabled={isUpdating || (isCod && !otpVal.trim())}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer transition flex-1 sm:flex-none disabled:opacity-55"
              >
                Delivered
              </button>
            </div>
          </div>
        </div>
      )}

      {type === "completed" && (
        <div className="border-t border-border/50 pt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <span>Fulfillment concluded. Reference the audit history for tracking notes.</span>
        </div>
      )}
    </div>
  );
}
