"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/modules/admin/shared/components/DataTable";
import { Plus, Edit, Trash2 } from "lucide-react";
import { deleteCollection } from "@/app/admin/actions";
import { toast } from "sonner";
import Link from "next/link";

type CollectionData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  productCount: number;
  createdAt: string;
};

import { TableSearch, TablePagination } from "@/modules/admin/shared/components/DataTableControls";

export function CollectionsClient({
  collections,
  totalItems = 0,
}: {
  collections: CollectionData[];
  totalItems?: number;
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;
    setIsDeleting(id);
    const res = await deleteCollection(id);
    if (res.success) {
      toast.success("Collection deleted successfully");
    } else {
      toast.error(res.error || "Failed to delete collection");
    }
    setIsDeleting(null);
  };

  const cols: Column<CollectionData>[] = [
    {
      key: "img",
      header: "Image",
      render: (c) => (
        <div className="h-10 w-10 rounded overflow-hidden bg-muted border border-border flex items-center justify-center">
          {c.imageUrl ? (
            <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
              No Image
            </span>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Collection Name",
      sortKey: "name",
      render: (c) => (
        <div>
          <p className="font-semibold">{c.name}</p>
          <p className="text-xs text-muted-foreground">/{c.slug}</p>
        </div>
      ),
    },
    {
      key: "desc",
      header: "Description",
      render: (c) => (
        <span className="text-sm truncate max-w-[200px] inline-block">{c.description || "—"}</span>
      ),
    },
    {
      key: "count",
      header: "Products",
      render: (c) => <span className="text-sm">{c.productCount}</span>,
    },
    {
      key: "featured",
      header: "Featured",
      sortKey: "isFeatured",
      render: (c) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${c.isFeatured ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}
        >
          {c.isFeatured ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortKey: "isActive",
      render: (c) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}
        >
          {c.isActive ? "Active" : "Draft"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => (
        <div className="flex gap-1 justify-end">
          <Link
            href={`/admin/inventory/collections/${c.id}/edit`}
            className="p-1.5 hover:bg-muted rounded cursor-pointer text-foreground"
          >
            <Edit className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => handleDelete(c.id)}
            disabled={isDeleting === c.id}
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
        <TableSearch placeholder="Search collections..." />
        <div className="flex gap-2">
          <Link
            href="/admin/inventory/collections/new"
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Collection
          </Link>
        </div>
      </div>
      <div>
        <DataTable columns={cols} rows={collections} empty="No collections found." />
        <TablePagination totalItems={totalItems} itemsPerPage={10} />
      </div>
    </div>
  );
}
