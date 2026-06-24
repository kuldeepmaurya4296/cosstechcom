"use client";

import { useState, useEffect } from "react";
import { DataTable, type Column } from "@/modules/admin/shared/components/DataTable";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Sparkles,
  Calendar,
  Check,
  AlertCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";

type FlashSaleData = {
  _id: string;
  id: string;
  name: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  products: any[];
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
};

type ProductSimple = {
  id: string;
  name: string;
  salePrice: number;
  image: string;
  category: { name: string } | null;
};

export function FlashSalesClient() {
  const [sales, setSales] = useState<FlashSaleData[]>([]);
  const [products, setProducts] = useState<ProductSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSaleData | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("0");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Product search inside modal
  const [productSearch, setProductSearch] = useState("");

  const fetchSales = async () => {
    try {
      const res = await fetch("/api/admin/flash-sales");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSales(data.map((s: any) => ({ ...s, id: s._id })));
      } else {
        toast.error("Failed to load flash sales");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while fetching flash sales.");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchSales(), fetchProducts()]);
      setLoading(false);
    };
    init();
  }, []);

  const openAddModal = () => {
    setEditingSale(null);
    setName("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("0");
    setSelectedProductIds([]);

    const now = new Date();
    const localStart = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
    const localEnd = new Date(end.getTime() - end.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setStartTime(localStart);
    setEndTime(localEnd);
    setIsActive(true);
    setProductSearch("");
    setShowModal(true);
  };

  const openEditModal = (sale: FlashSaleData) => {
    setEditingSale(sale);
    setName(sale.name);
    setDiscountType(sale.discountType);
    setDiscountValue(String(sale.discountValue));
    setSelectedProductIds(sale.products.map((p) => p._id || p));

    const localStart = new Date(
      new Date(sale.startTime).getTime() - new Date(sale.startTime).getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16);
    const localEnd = new Date(
      new Date(sale.endTime).getTime() - new Date(sale.endTime).getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16);

    setStartTime(localStart);
    setEndTime(localEnd);
    setIsActive(sale.isActive);
    setProductSearch("");
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this flash sale? This action cannot be undone."))
      return;
    try {
      const res = await fetch(`/api/admin/flash-sales/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Flash sale deleted successfully");
        fetchSales();
      } else {
        toast.error(data.error || "Failed to delete flash sale");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name for the sale.");
      return;
    }
    if (Number(discountValue) <= 0) {
      toast.error("Please enter a discount value greater than 0.");
      return;
    }
    if (discountType === "PERCENTAGE" && Number(discountValue) > 100) {
      toast.error("Percentage discount cannot exceed 100%.");
      return;
    }
    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product for this sale.");
      return;
    }
    if (!startTime || !endTime) {
      toast.error("Please select start and end dates.");
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      toast.error("End date must be after the start date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        discountType,
        discountValue: Number(discountValue),
        products: selectedProductIds,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        isActive,
      };

      const endpoint = editingSale
        ? `/api/admin/flash-sales/${editingSale._id}`
        : "/api/admin/flash-sales";
      const method = editingSale ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save flash sale.");
        return;
      }

      toast.success(
        editingSale ? "Flash sale updated successfully" : "Flash sale created successfully",
      );
      setShowModal(false);
      fetchSales();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleProductSelect = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const filteredSales = sales.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const formatDateTimeString = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cols: Column<FlashSaleData>[] = [
    {
      key: "name",
      header: "Flash Sale Name",
      render: (s) => (
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cognac" />
          <span className="font-bold text-sm text-foreground">{s.name}</span>
        </div>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      render: (s) => (
        <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-500/10 text-amber-700 font-mono">
          {s.discountType === "PERCENTAGE"
            ? `${s.discountValue}% Off`
            : `-${formatINR(s.discountValue)}`}
        </span>
      ),
    },
    {
      key: "productsCount",
      header: "Products",
      render: (s) => (
        <span className="text-sm font-semibold text-charcoal">{s.products?.length || 0} items</span>
      ),
    },
    {
      key: "timeline",
      header: "Active Timeline",
      render: (s) => (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-foreground/75 w-8">From:</span>
            <span>{formatDateTimeString(s.startTime)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-foreground/75 w-8">To:</span>
            <span>{formatDateTimeString(s.endTime)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => {
        const now = new Date();
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        const isPast = end < now;
        const isUpcoming = start > now;
        const isCurrentlyActive = s.isActive && start <= now && end >= now;

        return (
          <span
            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isPast
                ? "bg-muted text-muted-foreground border border-border"
                : isUpcoming
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : isCurrentlyActive
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {isPast ? "Expired" : isUpcoming ? "Upcoming" : isCurrentlyActive ? "Active" : "Paused"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (s) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={() => openEditModal(s)}
            className="p-1.5 hover:bg-muted rounded cursor-pointer text-foreground transition"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(s._id)}
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
          placeholder="Search by sale name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-lg border border-border bg-card px-4.5 py-2.5 text-sm max-w-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition w-full"
        />
        <button
          onClick={openAddModal}
          className="bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow transition"
        >
          <Plus className="h-4 w-4" /> Schedule Flash Sale
        </button>
      </div>

      {/* Flash Sales Table */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground font-semibold">Loading scheduled sales...</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <DataTable columns={cols} rows={filteredSales} empty="No flash sales scheduled." />
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
            className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cognac" />
                <h3 className="font-serif font-bold text-lg">
                  {editingSale ? "Edit Scheduled Flash Sale" : "Schedule Flash Sale"}
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
              {/* Sale Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Campaign Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midnight Madness, Eid Flash Drop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition font-bold"
                  required
                />
              </div>

              {/* Discount Details */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Discount Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer font-semibold"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Discount (₹)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Discount Value ({discountType === "PERCENTAGE" ? "%" : "₹"}){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={discountType === "PERCENTAGE" ? "100" : undefined}
                    placeholder="Value"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Time Schedule */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Starts At <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Ends At <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Select Participating Products <span className="text-destructive">*</span> (
                  {selectedProductIds.length} selected)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="Search footwear catalog..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/10 transition"
                  />
                </div>

                <div className="border border-border/80 rounded-xl overflow-hidden max-h-44 overflow-y-auto bg-muted/20 divide-y divide-border/40 scrollbar-thin">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground font-semibold">
                      No matching products found.
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = selectedProductIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProductSelect(p.id)}
                          className={`flex items-center gap-3 p-3.5 cursor-pointer hover:bg-cream/40 transition-colors ${
                            isSelected ? "bg-cognac/5" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="h-4 w-4 text-primary focus:ring-primary border-border cursor-pointer accent-cognac"
                          />
                          {p.image && (
                            <img
                              src={p.image}
                              alt=""
                              className="h-9 w-9 object-cover rounded-md border border-border/60 shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-xs text-charcoal block truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              {p.category?.name || "Uncategorized"} · Standard Price:{" "}
                              {formatINR(p.salePrice)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Campaign Status
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    If disabled, the flash discounts won&apos;t apply even during scheduled hours.
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
                  "Save Sale"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
