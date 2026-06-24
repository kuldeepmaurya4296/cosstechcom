"use client";

import { useState, useEffect } from "react";
import { DataTable, type Column } from "@/modules/admin/shared/components/DataTable";
import { Plus, Edit, Trash2, X, Ticket, Calendar, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";

type CouponData = {
  _id: string;
  id: string;
  code: string;
  type: "Flat" | "Percentage" | "Free Shipping";
  value: number;
  minCartValue: number;
  validFrom: string;
  validTill: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
};

export function CouponsClient() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponData | null>(null);

  // Form States
  const [code, setCode] = useState("");
  const [type, setType] = useState<"Flat" | "Percentage" | "Free Shipping">("Flat");
  const [value, setValue] = useState("0");
  const [minCartValue, setMinCartValue] = useState("0");
  const [validFrom, setValidFrom] = useState("");
  const [validTill, setValidTill] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/coupons");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCoupons(data.map((c: any) => ({ ...c, id: c._id })));
      } else {
        toast.error("Failed to load coupons");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while fetching coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAddModal = () => {
    setEditingCoupon(null);
    setCode("");
    setType("Flat");
    setValue("0");
    setMinCartValue("0");

    // Set default dates
    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const tillDate = nextMonth.toISOString().split("T")[0];

    setValidFrom(today);
    setValidTill(tillDate);
    setUsageLimit("");
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (coupon: CouponData) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setType(coupon.type);
    setValue(String(coupon.value));
    setMinCartValue(String(coupon.minCartValue));
    setValidFrom(coupon.validFrom ? new Date(coupon.validFrom).toISOString().split("T")[0] : "");
    setValidTill(coupon.validTill ? new Date(coupon.validTill).toISOString().split("T")[0] : "");
    setUsageLimit(coupon.usageLimit !== undefined ? String(coupon.usageLimit) : "");
    setIsActive(coupon.isActive);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon? This action cannot be undone."))
      return;
    try {
      const res = await fetch(`/api/coupons?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
      } else {
        toast.error(data.error || "Failed to delete coupon");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }
    if (Number(value) <= 0 && type !== "Free Shipping") {
      toast.error("Please enter a discount value greater than 0.");
      return;
    }
    if (type === "Percentage" && Number(value) > 100) {
      toast.error("Percentage discount cannot exceed 100%.");
      return;
    }
    if (!validTill) {
      toast.error("Please select an expiration date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: editingCoupon?._id,
        code: code.trim(),
        type,
        value: type === "Free Shipping" ? 0 : Number(value),
        minCartValue: Number(minCartValue || 0),
        validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
        validTill: new Date(validTill).toISOString(),
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        isActive,
      };

      const endpoint = "/api/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save coupon.");
        return;
      }

      toast.success(editingCoupon ? "Coupon updated successfully" : "Coupon created successfully");
      setShowModal(false);
      fetchCoupons();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const cols: Column<CouponData>[] = [
    {
      key: "code",
      header: "Coupon Code",
      render: (c) => (
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-cognac" />
          <span className="font-bold font-mono tracking-wider text-sm bg-muted px-2 py-0.5 rounded border border-border text-foreground">
            {c.code}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (c) => (
        <span className="text-xs font-semibold px-2 py-1 rounded bg-secondary text-secondary-foreground">
          {c.type}
        </span>
      ),
    },
    {
      key: "value",
      header: "Discount Value",
      render: (c) => (
        <span className="font-serif font-bold text-sm">
          {c.type === "Percentage"
            ? `${c.value}%`
            : c.type === "Free Shipping"
              ? "Free Shipping"
              : formatINR(c.value)}
        </span>
      ),
    },
    {
      key: "minCart",
      header: "Min Cart Value",
      render: (c) => (
        <span className="text-sm text-muted-foreground">
          {c.minCartValue > 0 ? formatINR(c.minCartValue) : "No Minimum"}
        </span>
      ),
    },
    {
      key: "usage",
      header: "Usage (Used / Limit)",
      render: (c) => (
        <span className="text-xs font-medium">
          {c.usedCount} / {c.usageLimit !== undefined ? c.usageLimit : "∞"}
        </span>
      ),
    },
    {
      key: "expiry",
      header: "Expiry Date",
      render: (c) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDateString(c.validTill)}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => {
        const isExpired = new Date(c.validTill) < new Date();
        return (
          <span
            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isExpired
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : c.isActive
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {isExpired ? "Expired" : c.isActive ? "Active" : "Draft"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={() => openEditModal(c)}
            className="p-1.5 hover:bg-muted rounded cursor-pointer text-foreground transition"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(c._id)}
            className="p-1.5 hover:bg-destructive/10 text-destructive rounded cursor-pointer transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <input
          type="text"
          placeholder="Search by coupon code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-lg border border-border bg-card px-4.5 py-2.5 text-sm max-w-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition w-full"
        />
        <button
          onClick={openAddModal}
          className="bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow transition"
        >
          <Plus className="h-4 w-4" /> Create Coupon
        </button>
      </div>

      {/* Coupons Table */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground font-semibold">Loading coupons list...</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <DataTable columns={cols} rows={filteredCoupons} empty="No coupons configured." />
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Container */}
          <form
            onSubmit={handleSubmit}
            className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-cognac" />
                <h3 className="font-serif font-bold text-lg">
                  {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Coupon Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Coupon Code <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME20, FESTIVE500"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition font-mono tracking-wider font-bold"
                  required
                />
              </div>

              {/* Discount Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Discount Type <span className="text-destructive">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setType(newType);
                    if (newType === "Free Shipping") setValue("0");
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
                >
                  <option value="Flat">Flat Cash Discount (INR)</option>
                  <option value="Percentage">Percentage Discount (%)</option>
                  <option value="Free Shipping">Free Shipping</option>
                </select>
              </div>

              {/* Discount Value */}
              {type !== "Free Shipping" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Discount Value ({type === "Percentage" ? "%" : "₹"}){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={type === "Percentage" ? "100" : undefined}
                    placeholder={type === "Percentage" ? "e.g. 15" : "e.g. 500"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                    required
                  />
                </div>
              )}

              {/* Minimum Cart Value */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Minimum Cart Subtotal (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 999 (0 for no limit)"
                  value={minCartValue}
                  onChange={(e) => setMinCartValue(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              {/* Date Ranges */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Valid Till <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={validTill}
                    onChange={(e) => setValidTill(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Usage Limit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Total Usage Limit (Times)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited usage"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Active Status
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    {" "}
                    shoppers can immediately validate this coupon if active.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    isActive ? "bg-primary" : "bg-muted border border-border"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="px-4.5 py-2 text-xs rounded-full border border-border hover:bg-muted font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5.5 py-2.5 text-xs rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Coupon"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
