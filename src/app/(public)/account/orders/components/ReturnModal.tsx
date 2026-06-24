import React, { useState } from "react";
import { X, RotateCcw, Clock } from "lucide-react";
import { toast } from "sonner";

const RETURN_REASONS = [
  "Size doesn't fit",
  "Defective / Damaged product",
  "Wrong item received",
  "Quality not as expected",
  "Changed my mind",
  "Other",
];

interface ReturnModalProps {
  order: any;
  daysRemaining: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReturnModal({ order, daysRemaining, onClose, onSuccess }: ReturnModalProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a return reason.");
      return;
    }
    setSubmitting(true);
    try {
      const note = `Return requested: ${reason}${details.trim() ? ` — ${details.trim()}` : ""}`;
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId, status: "RETURN_REQUESTED", note }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Return request failed.");
        return;
      }
      toast.success("Return request submitted! Our team will review it shortly.");
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
            <div className="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center">
              <RotateCcw className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base">Request Return</h3>
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
          {/* Countdown notice */}
          <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              You have{" "}
              <strong>
                {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
              </strong>{" "}
              remaining to request a return. Your request will be reviewed by our team before
              approval.
            </p>
          </div>

          {/* Items preview */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Items in this order
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {order.items.map((it: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5">
                  <img src={it.image} alt="" className="h-10 w-10 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{it.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Size {it.size} · {it.color}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Reason for return <span className="text-destructive">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition appearance-none cursor-pointer"
            >
              <option value="">Select a reason…</option>
              {RETURN_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Details */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Additional details <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Describe the issue in more detail…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 pt-3 border-t border-border">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition font-medium cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="px-5 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                Submit Return Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
