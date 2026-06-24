import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";

const standardOrder = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

const getAllowedTransitions = (currentStatus: string) => {
  if (currentStatus === "REFUNDED") return [];
  if (currentStatus === "CANCELLED") return [];
  if (currentStatus === "RETURN_REQUESTED")
    return [
      { label: "Approve Return (Awaiting Pickup)", value: "RETURN_APPROVED" },
      { label: "Reject Return (Back to Delivered)", value: "DELIVERED" },
    ];
  if (currentStatus === "RETURN_APPROVED")
    return [{ label: "Product Received (Mark Returned)", value: "RETURNED" }];
  if (currentStatus === "RETURNED") return [{ label: "Refunded", value: "REFUNDED" }];

  const curIdx = standardOrder.indexOf(currentStatus);
  if (curIdx === -1) return [];

  const allowed = [];

  const standardStages = [
    { label: "Placed", value: "PLACED" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Packed", value: "PACKED" },
    { label: "Shipped", value: "SHIPPED" },
    { label: "Out For Delivery", value: "OUT_FOR_DELIVERY" },
    { label: "Delivered", value: "DELIVERED" },
  ];

  for (let i = curIdx + 1; i < standardStages.length; i++) {
    allowed.push(standardStages[i]);
  }

  if (currentStatus !== "DELIVERED") {
    allowed.push({ label: "Cancelled", value: "CANCELLED" });
  }

  return allowed;
};

const ALL_STAGES = [
  { label: "Placed", value: "PLACED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Packed", value: "PACKED" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Out For Delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Return Requested", value: "RETURN_REQUESTED" },
  { label: "Awaiting Product Return", value: "RETURN_APPROVED" },
  { label: "Returned", value: "RETURNED" },
  { label: "Refunded", value: "REFUNDED" },
];

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrder: any;
  onSubmitSuccess: () => void;
}

export function UpdateStatusModal({
  isOpen,
  onClose,
  selectedOrder,
  onSubmitSuccess,
}: UpdateStatusModalProps) {
  const [status, setStatus] = useState("PLACED");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [refundMethod, setRefundMethod] = useState<"ONLINE" | "CASH">("ONLINE");
  const [refundTransactionId, setRefundTransactionId] = useState("");
  const [codPaymentReceived, setCodPaymentReceived] = useState(false);

  // Delivery State
  const [deliveryMethod, setDeliveryMethod] = useState<"SELF" | "THIRD_PARTY">("SELF");
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [selectedCarrierId, setSelectedCarrierId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);

  useEffect(() => {
    if (selectedOrder) {
      const currentStatus = selectedOrder.status || "PLACED";
      setStatus(currentStatus);
      setNote("");
      setRefundMethod("ONLINE");
      setRefundTransactionId("");
      setCodPaymentReceived(false);

      // Prefill delivery details if already assigned
      setDeliveryMethod(selectedOrder.shipping?.deliveryMethod || "SELF");
      setSelectedRiderId(selectedOrder.shipping?.deliveryPersonName || "");
      setSelectedCarrierId(selectedOrder.shipping?.courier || "");
      setTrackingNumber(selectedOrder.shipping?.trackingNumber || "");
    }
  }, [selectedOrder, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/admin/delivery-partners")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setDeliveryPartners(data.filter((p) => p.isActive));
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !selectedOrder) return null;

  const allowedNext = getAllowedTransitions(selectedOrder.status);

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === "REFUNDED" && refundMethod === "ONLINE" && !refundTransactionId.trim()) {
      toast.error("Refund Transaction ID is required for online refunds.");
      return;
    }

    if (status === "DELIVERED" && selectedOrder.paymentMethod === "COD" && !codPaymentReceived) {
      toast.error("Confirmation of payment received is required for Cash on Delivery orders.");
      return;
    }

    if (status === "SHIPPED") {
      if (deliveryMethod === "SELF" && !selectedRiderId) {
        toast.error("Please assign a delivery rider.");
        return;
      }
      if (deliveryMethod === "THIRD_PARTY" && (!selectedCarrierId || !trackingNumber.trim())) {
        toast.error("Please select a courier partner and enter an AWB tracking number.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.orderId,
          status,
          note,
          refundMethod: status === "REFUNDED" ? refundMethod : undefined,
          refundTransactionId: status === "REFUNDED" ? refundTransactionId : undefined,
          codPaymentReceived:
            status === "DELIVERED" && selectedOrder.paymentMethod === "COD"
              ? codPaymentReceived
              : undefined,
          deliveryMethod: status === "SHIPPED" ? deliveryMethod : undefined,
          deliveryPersonName:
            status === "SHIPPED" && deliveryMethod === "SELF" ? selectedRiderId : undefined,
          deliveryPersonPhone:
            status === "SHIPPED" && deliveryMethod === "SELF"
              ? deliveryPartners.find((p) => p.name === selectedRiderId)?.phone || ""
              : undefined,
          courier:
            status === "SHIPPED" && deliveryMethod === "THIRD_PARTY"
              ? selectedCarrierId
              : undefined,
          trackingNumber:
            status === "SHIPPED" && deliveryMethod === "THIRD_PARTY" ? trackingNumber : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update order status");

      toast.success("Order status updated successfully!");
      onSubmitSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const isShippingDetailsChanged =
    deliveryMethod !== (selectedOrder.shipping?.deliveryMethod || "SELF") ||
    selectedRiderId !== (selectedOrder.shipping?.deliveryPersonName || "") ||
    selectedCarrierId !== (selectedOrder.shipping?.courier || "") ||
    trackingNumber !== (selectedOrder.shipping?.trackingNumber || "");

  const isSubmitDisabled =
    saving ||
    (status === selectedOrder.status && !(status === "SHIPPED" && isShippingDetailsChanged)) ||
    (status === "DELIVERED" && selectedOrder.paymentMethod === "COD" && !codPaymentReceived);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
          <div>
            <h3 className="font-serif text-lg font-bold">Update Order Status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Order ID: {selectedOrder.orderId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSaveStatus} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {allowedNext.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs font-semibold leading-relaxed">
              This order is in the final "{selectedOrder.status.toLowerCase().replace(/_/g, " ")}"
              stage and no further transition steps are allowed.
            </div>
          ) : (
            <>
              <div className="bg-muted/30 border border-border rounded-xl p-3 flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-foreground uppercase tracking-wider">
                  Current Status
                </span>
                <span className="capitalize text-foreground font-bold">
                  {selectedOrder.status.toLowerCase().replace(/_/g, " ")}
                </span>
              </div>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Next Lifecycle Stage *
                </span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition font-medium cursor-pointer"
                >
                  {ALL_STAGES.map((opt) => {
                    const isCurrent = opt.value === selectedOrder.status;
                    const match = allowedNext.find((x: any) => x.value === opt.value);
                    const isAllowed = isCurrent || !!match;

                    let displayLabel = opt.label;
                    if (isCurrent) {
                      displayLabel = `${opt.label} (Current Status)`;
                    } else if (match) {
                      displayLabel = match.label;
                    } else {
                      displayLabel = `${opt.label} (Locked)`;
                    }

                    return (
                      <option key={opt.value} value={opt.value} disabled={!isAllowed}>
                        {displayLabel}
                      </option>
                    );
                  })}
                </select>
              </label>

              {status === "REFUNDED" && (
                <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-primary">
                    Refund Details
                  </h4>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Refund Method *
                    </span>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="statusRefundMethod"
                          value="ONLINE"
                          checked={refundMethod === "ONLINE"}
                          onChange={() => setRefundMethod("ONLINE")}
                          className="accent-primary"
                        />
                        <span>Online (Razorpay / UPI)</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="statusRefundMethod"
                          value="CASH"
                          checked={refundMethod === "CASH"}
                          onChange={() => setRefundMethod("CASH")}
                          className="accent-primary"
                        />
                        <span>Cash / Offline</span>
                      </label>
                    </div>
                  </div>

                  {refundMethod === "ONLINE" && (
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Refund Transaction ID *
                      </span>
                      <input
                        type="text"
                        value={refundTransactionId}
                        onChange={(e) => setRefundTransactionId(e.target.value)}
                        placeholder="Enter Razorpay Refund / UPI transaction ID"
                        required
                        className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                      />
                    </label>
                  )}
                </div>
              )}

              {status === "DELIVERED" && selectedOrder.paymentMethod === "COD" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2.5">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-amber-800 flex items-center gap-1.5">
                    ⚠️ Payment Verification Required
                  </h4>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    This is a Cash on Delivery (COD) order. Before updating to Delivered, please
                    verify that you have collected the total payment amount from the customer.
                  </p>
                  <label className="flex items-start gap-2.5 text-xs font-semibold text-amber-900 cursor-pointer select-none border-t border-amber-200/50 pt-2.5 mt-1">
                    <input
                      type="checkbox"
                      checked={codPaymentReceived}
                      onChange={(e) => setCodPaymentReceived(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-amber-800 rounded"
                    />
                    <span>
                      I confirm that the cash payment of{" "}
                      <strong className="font-bold">{formatINR(selectedOrder.total)}</strong> has
                      been collected and received in full.
                    </span>
                  </label>
                </div>
              )}

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tracking Note / Logs
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    status === "REFUNDED"
                      ? "e.g. Refunded via payment gateway. Reaches in 5-7 days."
                      : "e.g. Shipped via Delhivery. Tracking ID: DLV-12345"
                  }
                  rows={3}
                  className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition resize-none"
                />
              </label>

              {status === "SHIPPED" && (
                <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4 animate-in fade-in duration-200">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-primary">
                    Shipping & Delivery Assignment
                  </h4>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Delivery Method *
                    </span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="statusDeliveryMethod"
                          value="SELF"
                          checked={deliveryMethod === "SELF"}
                          onChange={() => setDeliveryMethod("SELF")}
                          className="accent-primary"
                        />
                        <span>Self Delivery (Rider)</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="statusDeliveryMethod"
                          value="THIRD_PARTY"
                          checked={deliveryMethod === "THIRD_PARTY"}
                          onChange={() => setDeliveryMethod("THIRD_PARTY")}
                          className="accent-primary"
                        />
                        <span>Third-Party Courier</span>
                      </label>
                    </div>
                  </div>

                  {deliveryMethod === "SELF" ? (
                    <div>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Assign Delivery Personnel *
                        </span>
                        <select
                          value={selectedRiderId}
                          onChange={(e) => setSelectedRiderId(e.target.value)}
                          required={status === "SHIPPED"}
                          className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition font-medium cursor-pointer"
                        >
                          <option value="">Select Rider...</option>
                          {deliveryPartners
                            .filter((p) => p.type === "SELF")
                            .map((p) => (
                              <option key={p._id} value={p.name}>
                                {p.name} ({p.phone})
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Select Courier Partner *
                        </span>
                        <select
                          value={selectedCarrierId}
                          onChange={(e) => setSelectedCarrierId(e.target.value)}
                          required={status === "SHIPPED"}
                          className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition font-medium cursor-pointer"
                        >
                          <option value="">Select Courier...</option>
                          {deliveryPartners
                            .filter((p) => p.type === "THIRD_PARTY")
                            .map((p) => (
                              <option key={p._id} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          AWB Number / Tracking ID *
                        </span>
                        <input
                          type="text"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="Enter tracking number"
                          required={status === "SHIPPED" && deliveryMethod === "THIRD_PARTY"}
                          className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4 border-t border-border mt-6 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-background border border-input text-foreground hover:bg-muted rounded-full px-5 py-2 text-sm font-semibold cursor-pointer transition"
            >
              Close
            </button>
            {allowedNext.length > 0 && (
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="bg-primary text-primary-foreground hover:bg-primary/95 rounded-full px-6 py-2 text-sm font-semibold cursor-pointer disabled:opacity-50 transition shadow"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
