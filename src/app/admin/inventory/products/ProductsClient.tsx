"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/modules/admin/shared/components/DataTable";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { formatINR } from "@/lib/format";
import { deleteProduct } from "@/app/admin/actions";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BulkUploadModal } from "./BulkUploadModal";

type ProductData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  rating: number;
  reviewsCount: number;
  isActive: boolean;
};

import { TableSearch, TablePagination } from "@/modules/admin/shared/components/DataTableControls";

export function ProductsClient({
  products,
  totalItems = 0,
}: {
  products: ProductData[];
  totalItems?: number;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setIsDeleting(id);
    const res = await deleteProduct(id);
    if (res.success) {
      toast.success("Product deleted successfully");
    } else {
      toast.error(res.error || "Failed to delete product");
    }
    setIsDeleting(null);
  };

  const cols: Column<ProductData>[] = [
    {
      key: "p",
      header: "Product",
      sortKey: "name",
      render: (p) => (
        <div className="flex items-center gap-3 min-w-0">
          <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{p.name}</p>
            <p className="text-xs text-muted-foreground">/{p.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "c",
      header: "Category",
      render: (p) => <span className="text-sm capitalize">{p.category}</span>,
    },
    {
      key: "pr",
      header: "Price",
      sortKey: "price",
      render: (p) => <span className="text-sm font-semibold">{formatINR(p.price)}</span>,
    },
    {
      key: "s",
      header: "Stock",
      render: (p) => (
        <span className={`text-sm font-semibold ${p.stock < 10 ? "text-destructive" : ""}`}>
          {p.stock}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortKey: "isActive",
      render: (p) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}
        >
          {p.isActive ? "Active" : "Draft"}
        </span>
      ),
    },
    {
      key: "a",
      header: "",
      className: "text-right",
      render: (p) => (
        <div className="flex gap-1 justify-end">
          <Link
            href={`/admin/inventory/products/${p.id}/edit`}
            className="p-1.5 hover:bg-muted rounded cursor-pointer text-foreground"
          >
            <Edit className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => handleDelete(p.id)}
            disabled={isDeleting === p.id}
            className="p-1.5 hover:bg-destructive/10 text-destructive rounded cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <TableSearch placeholder="Search products by name or slug..." />
        <div className="flex gap-2">
          <button
            onClick={() => setBulkUploadOpen(true)}
            className="border border-border hover:bg-muted text-foreground bg-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Upload className="h-4 w-4 text-brass" /> Bulk Import
          </button>
          <Link
            href="/admin/inventory/products/new"
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add product
          </Link>
        </div>
      </div>
      <div>
        <DataTable columns={cols} rows={products} empty="No products found." />
        <TablePagination totalItems={totalItems} itemsPerPage={10} />
      </div>
      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
