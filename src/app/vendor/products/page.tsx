"use client";

import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { DataTable, type Column } from "@/modules/admin/shared/components/DataTable";
import { products, type Product } from "@/data/products";
import { currentVendor } from "@/data/vendors";
import { Plus } from "lucide-react";
import { formatINR } from "@/lib/format";

const cols: Column<Product>[] = [
  {
    key: "p",
    header: "Product",
    render: (p) => (
      <div className="flex items-center gap-3">
        <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
        <span className="font-medium text-sm">{p.name}</span>
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
    render: (p) => <span className="text-sm font-semibold">{formatINR(p.price)}</span>,
  },
  {
    key: "s",
    header: "Stock",
    render: (p) => <span className="text-sm font-semibold">{p.stock}</span>,
  },
  {
    key: "a",
    header: "",
    render: () => <button className="text-xs underline font-semibold cursor-pointer">Edit</button>,
    className: "text-right",
  },
];

export default function VendorProductsPage() {
  const mine = products.filter((p) => p.vendorId === currentVendor.id);
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
      <DataTable columns={cols} rows={mine} />
    </DashboardPage>
  );
}
