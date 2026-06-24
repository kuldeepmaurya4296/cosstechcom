import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface CancelModalProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelModal({ order, onClose, onSuccess }: CancelModalProps) {
  const [refundMethod, setRefundMethod] = useState<"SAME_METHOD" | "BANK" | "UPI">("SAME_METHOD");
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    ifsc: "",
    holderName: "",
  });
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isPrepaid = order.paymentMethod
    ? order.paymentMethod !== "COD"
    : order.payment?.method !== "COD";

  const handleSubmit = async () => {
    if (isPrepaid) {
      if (refundMethod === "UPI" && !upiId.trim()) {
        toast.error("Please enter a valid UPI ID.");
        return;
      }
      if (
        refundMethod === "BANK" &&
        (!bankDetails.bankName.trim() ||
          !bankDetails.accountNumber.trim() ||
          !bankDetails.ifsc.trim() ||
          !bankDetails.holderName.trim())
      ) {
        toast.error("Please fill in all bank account fields.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const note = `Cancelled by customer.${reason.trim() ? ` Reason: ${reason.trim()}` : ""}`;
      const payload: any = {
        orderId: order.orderId,
        status: "CANCELLED",
        note,
      };

      if (isPrepaid) {
        payload.refundPreference = {
          method: refundMethod,
          upiId: refundMethod === "UPI" ? upiId.trim() : undefined,
          bankDetails:
            refundMethod === "BANK"
              ? {
                  bankName: bankDetails.bankName.trim(),
                  accountNumber: bankDetails.accountNumber.trim(),
                  ifsc: bankDetails.ifsc.trim(),
                  holderName: bankDetails.holderName.trim(),
                }
              : undefined,
        };
      }

      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Order cancellation failed.");
        return;
      }
      toast.success("Order cancelled successfully!");
      onSuccess();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
              <X className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base">Cancel Order</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Order {order.orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to cancel this order? This action cannot be undone.
          </p>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Reason for Cancellation
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Ordered by mistake, wrong size..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Refund details if prepaid */}
          {isPrepaid && (
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
              <h4 className="text-xs uppercase font-bold tracking-wider text-primary">
                Refund Destination
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Since this is a prepaid order, please select where you would like to receive your
                refund:
              </p>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="refundMethodOption"
                    value="SAME_METHOD"
                    checked={refundMethod === "SAME_METHOD"}
                    onChange={() => setRefundMethod("SAME_METHOD")}
                    className="accent-primary h-3.5 w-3.5"
                  />
                  <span>Original Payment Method (Razorpay)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="refundMethodOption"
                    value="UPI"
                    checked={refundMethod === "UPI"}
                    onChange={() => setRefundMethod("UPI")}
                    className="accent-primary h-3.5 w-3.5"
                  />
                  <span>UPI ID</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="refundMethodOption"
                    value="BANK"
                    checked={refundMethod === "BANK"}
                    onChange={() => setRefundMethod("BANK")}
                    className="accent-primary h-3.5 w-3.5"
                  />
                  <span>Bank Account Transfer</span>
                </label>
              </div>

              {refundMethod === "UPI" && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    UPI ID *
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobile@upi"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                  />
                </div>
              )}

              {refundMethod === "BANK" && (
                <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      value={bankDetails.holderName}
                      onChange={(e) =>
                        setBankDetails((prev) => ({ ...prev, holderName: e.target.value }))
                      }
                      placeholder="As per bank records"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        value={bankDetails.bankName}
                        onChange={(e) =>
                          setBankDetails((prev) => ({ ...prev, bankName: e.target.value }))
                        }
                        placeholder="e.g. SBI, HDFC"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        value={bankDetails.ifsc}
                        onChange={(e) =>
                          setBankDetails((prev) => ({
                            ...prev,
                            ifsc: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="e.g. SBIN0001234"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      value={bankDetails.accountNumber}
                      onChange={(e) =>
                        setBankDetails((prev) => ({ ...prev, accountNumber: e.target.value }))
                      }
                      placeholder="Enter bank account number"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 pt-3 border-t border-border">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition font-medium cursor-pointer disabled:opacity-50"
          >
            Go Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-sm rounded-lg bg-destructive hover:bg-destructive/95 text-white font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {submitting ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              "Confirm Cancellation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
