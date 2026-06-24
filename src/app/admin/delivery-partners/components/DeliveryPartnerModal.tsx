import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PartnerData {
  _id: string;
  name: string;
  type: "SELF" | "THIRD_PARTY";
  phone?: string;
  trackingUrlTemplate?: string;
  isActive: boolean;
}

interface DeliveryPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  editingPartner: PartnerData | null;
}

export function DeliveryPartnerModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  editingPartner,
}: DeliveryPartnerModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"SELF" | "THIRD_PARTY">("SELF");
  const [phone, setPhone] = useState("");
  const [trackingUrlTemplate, setTrackingUrlTemplate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingPartner) {
      setName(editingPartner.name);
      setType(editingPartner.type);
      setPhone(editingPartner.phone || "");
      setTrackingUrlTemplate(editingPartner.trackingUrlTemplate || "");
      setIsActive(editingPartner.isActive);
    } else {
      setName("");
      setType("SELF");
      setPhone("");
      setTrackingUrlTemplate("");
      setIsActive(true);
    }
  }, [editingPartner, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name.");
      return;
    }
    if (type === "SELF" && !phone.trim()) {
      toast.error("Phone number is required for self delivery staff.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingPartner?._id,
        name: name.trim(),
        type,
        phone: type === "SELF" ? phone.trim() : null,
        trackingUrlTemplate: type === "THIRD_PARTY" ? trackingUrlTemplate.trim() : null,
        isActive,
      };

      const res = await fetch("/api/admin/delivery-partners", {
        method: editingPartner ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save details");
      }

      toast.success(editingPartner ? "Delivery partner updated!" : "Delivery partner added!");
      onSubmitSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/10">
          <h3 className="font-serif text-base font-bold">
            {editingPartner ? "Edit Delivery Partner" : "Add Delivery Partner/Staff"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition cursor-pointer"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Partner Type <span className="text-destructive">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition cursor-pointer"
            >
              <option value="SELF">Self Delivery Personnel (Rider)</option>
              <option value="THIRD_PARTY">Third Party Delivery Partner (Courier)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Name / Alias <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "SELF" ? "e.g. Ramesh Kumar" : "e.g. Delhivery"}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
            />
          </div>

          {type === "SELF" ? (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Mobile Number <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile"
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Tracking URL Template
              </label>
              <input
                type="text"
                value={trackingUrlTemplate}
                onChange={(e) => setTrackingUrlTemplate(e.target.value)}
                placeholder="e.g. https://delhivery.com/track?awb={{tracking}}"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Use <code className="bg-muted px-1 rounded font-bold">{"{{tracking}}"}</code> where
                the AWB number should be inserted.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <label
              htmlFor="isActive"
              className="text-xs font-semibold text-muted-foreground select-none cursor-pointer"
            >
              Active Status (Available for assignments)
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-input text-foreground hover:bg-muted text-xs font-semibold rounded-full cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-full transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
