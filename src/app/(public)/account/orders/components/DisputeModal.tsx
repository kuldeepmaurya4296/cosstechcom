"use client";

import { useState } from "react";
import { X, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

interface DisputeModalProps {
  order: any;
  subOrder: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisputeModal({ order, subOrder, onClose, onSuccess }: DisputeModalProps) {
  const [type, setType] = useState("WRONG_ITEM");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please provide a description of the issue.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subOrderId: subOrder._id || subOrder.id,
          type,
          description: description.trim(),
          evidenceImages: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to raise dispute");
      }

      toast.success("Dispute raised successfully! Support agent will review it.");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to raise dispute. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-elevated relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer transition p-1 hover:bg-muted rounded-full"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <h3 className="font-serif text-lg md:text-xl font-bold text-foreground">
            Raise Dispute: {subOrder.subOrderId}
          </h3>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-5">
          If you received the wrong product, damaged items, or have fulfillment issues, raise a dispute. Our support agent will arbitrate between you and the vendor.
        </p>

        {/* Selected Package Details */}
        <div className="bg-muted/40 border border-border/40 p-4 rounded-xl mb-5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cognac">
            Disputed Items
          </span>
          <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
            {subOrder.items.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-center text-xs">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-8 w-8 object-cover rounded-lg border border-border shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-charcoal truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">Qty: {item.qty} | Size: {item.size} | Color: {item.color}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dispute Type */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1.5">
              Issue Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            >
              <option value="WRONG_ITEM">Wrong Item Received</option>
              <option value="DAMAGED">Damaged / Defective Product</option>
              <option value="NOT_DELIVERED">Package Not Received</option>
              <option value="QUALITY">Quality / Spec Mismatch</option>
              <option value="OTHER">Other Issues</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1.5">
              Provide Details / Description
            </label>
            <textarea
              required
              rows={4}
              placeholder="Explain the problem in detail so the support team can resolve it quickly..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground leading-relaxed resize-none"
            />
          </div>

          {/* Evidence URL */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1.5">
              Evidence Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="Paste image URL as evidence (e.g. from Vercel Blob, imgur)..."
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-3 border-t border-border/40 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Dispute"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
