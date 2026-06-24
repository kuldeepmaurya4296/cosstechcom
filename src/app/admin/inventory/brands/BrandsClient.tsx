"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/modules/admin/shared/components/DataTable";
import { Plus, Edit, Trash2 } from "lucide-react";
import { deleteBrand } from "@/app/admin/actions";
import { toast } from "sonner";
import Link from "next/link";

type BrandData = {
  id: string;
  name: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
};

import { TableSearch, TablePagination } from "@/modules/admin/shared/components/DataTableControls";

export function BrandsClient({
  brands,
  totalItems = 0,
}: {
  brands: BrandData[];
  totalItems?: number;
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;
    setIsDeleting(id);
    const res = await deleteBrand(id);
    if (res.success) {
      toast.success("Brand deleted successfully");
    } else {
      toast.error(res.error || "Failed to delete brand");
    }
    setIsDeleting(null);
  };

  const cols: Column<BrandData>[] = [
    {
      key: "img",
      header: "Logo",
      render: (b) => (
        <div className="h-10 w-10 rounded overflow-hidden bg-muted border border-border flex items-center justify-center">
          {b.imageUrl ? (
            <img src={b.imageUrl} alt={b.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
              No Logo
            </span>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Brand Name",
      sortKey: "name",
      render: (b) => <span className="font-semibold">{b.name}</span>,
    },
    {
      key: "order",
      header: "Display Order",
      sortKey: "order",
      render: (b) => <span className="text-sm">{b.order}</span>,
    },
    {
      key: "count",
      header: "Products Attached",
      render: (b) => <span className="text-sm">{b.productCount}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortKey: "isActive",
      render: (b) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${b.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}
        >
          {b.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (b) => (
        <div className="flex gap-1 justify-end">
          <Link
            href={`/admin/inventory/brands/${b.id}/edit`}
            className="p-1.5 hover:bg-muted rounded cursor-pointer text-foreground"
          >
            <Edit className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => handleDelete(b.id)}
            disabled={isDeleting === b.id}
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
        <TableSearch placeholder="Search brands..." />
        <div className="flex gap-2">
          <Link
            href="/admin/inventory/brands/new"
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Brand
          </Link>
        </div>
      </div>
      <div>
        <DataTable columns={cols} rows={brands} empty="No brands found." />
        <TablePagination totalItems={totalItems} itemsPerPage={10} />
      </div>
    </div>
  );
}
