"use client";

import React, { useState, useEffect } from "react";
import { DataTable, type Column } from "@/modules/admin/shared/components/DataTable";
import { Plus, Edit2, Trash2, Loader2, Users, Truck } from "lucide-react";
import { toast } from "sonner";
import { DeliveryPartnerModal } from "./components/DeliveryPartnerModal";

interface PartnerData {
  _id: string;
  id: string;
  name: string;
  type: "SELF" | "THIRD_PARTY";
  phone?: string;
  trackingUrlTemplate?: string;
  isActive: boolean;
}

export function DeliveryPartnersClient() {
  const [partners, setPartners] = useState<PartnerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "SELF" | "THIRD_PARTY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerData | null>(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delivery-partners");
      if (!res.ok) {
        throw new Error("Failed to fetch delivery partners");
      }
      const data = await res.json();
      setPartners(data.map((p: any) => ({ ...p, id: p._id })));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load partners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const openCreateModal = () => {
    setEditingPartner(null);
    setIsOpen(true);
  };

  const openEditModal = (partner: PartnerData) => {
    setEditingPartner(partner);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this delivery partner/staff?")) return;
    try {
      const res = await fetch(`/api/admin/delivery-partners?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Delivery partner deleted successfully!");
        fetchPartners();
      } else {
        toast.error(data.error || "Failed to delete delivery partner");
      }
    } catch (err) {
      toast.error("Failed to delete partner");
    }
  };

  const filtered = partners.filter((p) => {
    if (activeTab !== "ALL" && p.type !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q));
    }
    return true;
  });

  const cols: Column<PartnerData>[] = [
    {
      key: "name",
      header: "Name",
      sortKey: "name",
      render: (p) => (
        <div className="flex items-center gap-2">
          {p.type === "SELF" ? (
            <Users className="h-4 w-4 text-cognac" />
          ) : (
            <Truck className="h-4 w-4 text-primary" />
          )}
          <span className="font-semibold text-sm text-foreground">{p.name}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.type === "SELF" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}`}
        >
          {p.type === "SELF" ? "Self Rider" : "Courier Partner"}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone / Details",
      render: (p) => (
        <span className="text-sm">
          {p.type === "SELF"
            ? p.phone || "—"
            : p.trackingUrlTemplate
              ? "Tracking enabled"
              : "No tracking template"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortKey: "isActive",
      render: (p) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}
        >
          {p.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (p) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => openEditModal(p)}
            className="p-1 hover:bg-muted text-primary rounded cursor-pointer transition"
            title="Edit"
          >
            <Edit2 className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => handleDelete(p._id)}
            className="p-1 hover:bg-destructive/10 text-destructive rounded cursor-pointer transition"
            title="Delete"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Tabs */}
        <div className="flex border-b border-border gap-2 pb-px overflow-x-auto scrollbar-hide">
          {(["ALL", "SELF", "THIRD_PARTY"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition -mb-px cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "ALL"
                ? "All Logistics"
                : tab === "SELF"
                  ? "Self Riders"
                  : "Courier Partners"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 shrink-0">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition min-w-[200px]"
          />
          <button
            onClick={openCreateModal}
            className="bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
          >
            <Plus className="h-4 w-4" /> Add Courier/Staff
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground text-sm font-medium">Loading logistics partners...</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <DataTable
            columns={cols}
            rows={filtered}
            empty="No delivery staff or partners configured."
          />
        </div>
      )}

      {/* MODAL DIALOG */}
      <DeliveryPartnerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmitSuccess={fetchPartners}
        editingPartner={editingPartner}
      />
    </div>
  );
}
