"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { DataTable, type Column } from "@/modules/admin/shared/components/DataTable";
import { Plus, AlertCircle, RefreshCw } from "lucide-react";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

const cols: Column<any>[] = [
  {
    key: "p",
    header: "Product",
    render: (p) => {
      const imgUrl = p.images && p.images[0] ? p.images[0].url : "/assets/product-placeholder.jpg";
      return (
        <div className="flex items-center gap-3">
          <img src={imgUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <span className="font-medium text-sm">{p.name}</span>
        </div>
      );
    },
  },
  {
    key: "c",
    header: "Category",
    render: (p) => <span className="text-sm capitalize">{p.category?.name || p.category || "—"}</span>,
  },
  {
    key: "pr",
    header: "Price",
    render: (p) => <span className="text-sm font-semibold">{formatINR(p.salePrice || p.price)}</span>,
  },
  {
    key: "s",
    header: "Stock",
    render: (p) => {
      const stock = p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) ?? 0;
      return <span className="text-sm font-semibold">{stock}</span>;
    },
  },
  {
    key: "status",
    header: "Status",
    render: (p) => (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
        p.approvalStatus === "approved"
          ? "bg-emerald-500/10 text-emerald-600"
          : p.approvalStatus === "rejected"
          ? "bg-rose-500/10 text-rose-600"
          : "bg-amber-500/10 text-amber-600"
      }`}>
        {p.approvalStatus || "pending"}
      </span>
    )
  },
  {
    key: "a",
    header: "",
    render: () => <button className="text-xs underline font-semibold cursor-pointer">Edit</button>,
    className: "text-right",
  },
];

export default function VendorProductsPage() {
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/products");
      if (!res.ok) {
        throw new Error("Failed to load products from server.");
      }
      const data = await res.json();
      setProductsList(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load products.");
      toast.error(err.message || "Failed to load vendor products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <DashboardPage
      eyebrow="Inventory"
      title="My products"
      action={
        <button className="bg-accent text-accent-foreground rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" /> New product
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center max-w-lg mx-auto mt-8">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-foreground mb-1">Failed to Load Products</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer transition shadow"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : (
        <DataTable columns={cols} rows={productsList} empty="No products found in database." />
      )}
    </DashboardPage>
  );
}
