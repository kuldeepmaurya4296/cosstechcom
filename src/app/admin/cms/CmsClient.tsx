"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Mail,
  Send,
  CheckCircle,
  ShieldAlert,
  Scale,
  FileText,
  Shield,
  Info,
  Truck,
  Megaphone,
} from "lucide-react";
import {
  saveBanner,
  deleteBanner,
  saveSetting,
  saveBrand,
  deleteBrand,
  deleteSubscriber,
  sendNewsletterBlast,
} from "./actions";
import { updateCategory } from "@/app/admin/actions";
import { toast } from "sonner";
import { DataTable, type Column } from "@/modules/admin/shared/components/DataTable";
import { ImageUploader } from "@/modules/admin/shared/components/ImageUploader";
import { RichTextEditor } from "@/modules/admin/shared/components/RichTextEditor";

const DEFAULT_TRUST_BADGES = [
  { icon: "Award", title: "Verified Sellers", subtitle: "100% authentic brands" },
  { icon: "ShieldCheck", title: "Quality Assured", subtitle: "Rigorous standards check" },
  { icon: "Truck", title: "Free Shipping", subtitle: "Orders above ₹2000" },
  { icon: "RotateCcw", title: "Simple Exchanges", subtitle: "Within 30 days hassle-free" },
];

export function CmsClient({
  banners,
  settings,
  categories = [],
  brands = [],
  subscribers = [],
}: {
  banners: any[];
  settings: any[];
  categories?: any[];
  brands?: any[];
  subscribers?: any[];
}) {
  const [tab, setTab] = useState<
    | "banners"
    | "categories"
    | "brands"
    | "trust_badges"
    | "newsletter"
    | "settings"
    | "legal"
    | "announcements"
  >("banners");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap border-b border-border gap-1">
        <button
          onClick={() => setTab("banners")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === "banners" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Banners
        </button>
        <button
          onClick={() => setTab("categories")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === "categories" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Shop by Style (Categories)
        </button>
        <button
          onClick={() => setTab("brands")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === "brands" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Authorized Brands
        </button>
        <button
          onClick={() => setTab("trust_badges")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === "trust_badges" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Trust Badges
        </button>
        <button
          onClick={() => setTab("newsletter")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === "newsletter" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Newsletter & Blast
        </button>
        <button
          onClick={() => setTab("legal")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === "legal" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Legal Policies
        </button>
        <button
          onClick={() => setTab("settings")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === "settings" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Pages & Settings
        </button>
        <button
          onClick={() => setTab("announcements")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === "announcements" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Announcement Bar
        </button>
      </div>

      {/* Tab Content */}
      {tab === "banners" && <BannersTab banners={banners} />}
      {tab === "categories" && <CategoriesTab categories={categories} />}
      {tab === "brands" && <BrandsTab brands={brands} />}
      {tab === "trust_badges" && <TrustBadgesTab settings={settings} />}
      {tab === "newsletter" && <NewsletterTab subscribers={subscribers} />}
      {tab === "legal" && <LegalTab settings={settings} />}
      {tab === "settings" && <SettingsTab settings={settings} />}
      {tab === "announcements" && <AnnouncementsTab settings={settings} />}
    </div>
  );
}

// Banners Tab Component
function BannersTab({ banners }: { banners: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    subtitle: "",
    imageUrl: "",
    linkUrl: "",
    order: 0,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cols: Column<any>[] = [
    {
      key: "img",
      header: "Image",
      render: (b) => (
        <img src={b.imageUrl} alt="banner" className="h-10 w-20 object-cover rounded" />
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (b) => <span className="font-semibold text-sm">{b.title || "—"}</span>,
    },
    { key: "order", header: "Order", render: (b) => <span className="text-sm">{b.order}</span> },
    {
      key: "status",
      header: "Status",
      render: (b) => (
        <span
          className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${b.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}
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
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setFormData(b);
              setShowForm(true);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={async () => {
              if (confirm("Delete this banner?")) {
                await deleteBanner(b.id);
                toast.success("Banner deleted");
              }
            }}
            className="text-destructive hover:opacity-80"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await saveBanner(formData);
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Banner saved successfully");
      setShowForm(false);
    } else {
      toast.error(res.error || "Failed to save banner");
    }
  };

  if (showForm) {
    return (
      <div className="bg-card p-6 rounded-xl border border-border">
        <h3 className="text-lg font-semibold mb-4">{formData.id ? "Edit Banner" : "New Banner"}</h3>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <ImageUploader
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            label="Image URL *"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border border-border rounded bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full p-2 border border-border rounded bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Link URL</label>
              <input
                type="text"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                className="w-full p-2 border border-border rounded bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full p-2 border border-border rounded bg-background"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <span className="text-sm font-medium">Is Active</span>
          </label>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-muted text-foreground rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded font-medium disabled:opacity-50"
            >
              Save Banner
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Hero Banners</h3>
        <button
          onClick={() => {
            setFormData({
              id: "",
              title: "",
              subtitle: "",
              imageUrl: "",
              linkUrl: "",
              order: 0,
              isActive: true,
            });
            setShowForm(true);
          }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium text-sm flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Banner
        </button>
      </div>
      <DataTable columns={cols} rows={banners} empty="No banners configured." />
    </div>
  );
}

// Categories Tab Component
function CategoriesTab({ categories }: { categories: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cols: Column<any>[] = [
    {
      key: "img",
      header: "Image",
      render: (c) => (
        <div className="h-10 w-10 rounded overflow-hidden bg-muted border border-border flex items-center justify-center">
          {c.imageUrl ? (
            <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
              No Img
            </span>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (c) => (
        <div>
          <span className="font-semibold text-sm">{c.name}</span>
          <p className="text-xs text-muted-foreground">/{c.slug}</p>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (c) => <span className="text-sm line-clamp-1 max-w-xs">{c.description || "—"}</span>,
    },
    {
      key: "styles",
      header: "Styles Count",
      render: (c) => <span className="text-sm">{c.productCount}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <span
          className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}
        >
          {c.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setFormData(c);
              setShowForm(true);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await updateCategory(formData.id, {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      isActive: formData.isActive,
      imageUrl: formData.imageUrl,
    });
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Category updated successfully");
      setShowForm(false);
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to update category");
    }
  };

  if (showForm) {
    return (
      <div className="bg-card p-6 rounded-xl border border-border">
        <h3 className="text-lg font-semibold mb-4">Edit Silhouette Category</h3>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-border rounded bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug *</label>
              <input
                required
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full p-2 border border-border rounded bg-background"
              />
            </div>
          </div>
          <ImageUploader
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            label="Image URL"
          />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-border rounded bg-background"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <span className="text-sm font-medium">Is Active (Visible on home page grid)</span>
          </label>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-muted text-foreground rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded font-medium disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-base">Homepage Categories ("Shop by Style")</h3>
          <p className="text-xs text-muted-foreground">
            Manage the shoe styles/categories displayed on the homepage category grid.
          </p>
        </div>
      </div>
      <DataTable columns={cols} rows={categories} empty="No categories configured." />
    </div>
  );
}

// Authorized Brands Tab Component
function BrandsTab({ brands }: { brands: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    imageUrl: "",
    order: 0,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cols: Column<any>[] = [
    {
      key: "logo",
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
      render: (b) => <span className="font-semibold text-sm">{b.name}</span>,
    },
    { key: "order", header: "Order", render: (b) => <span className="text-sm">{b.order}</span> },
    {
      key: "status",
      header: "Status",
      render: (b) => (
        <span
          className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${b.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}
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
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setFormData(b);
              setShowForm(true);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={async () => {
              if (confirm(`Delete ${b.name} Brand?`)) {
                await deleteBrand(b.id);
                toast.success("Brand deleted successfully");
                window.location.reload();
              }
            }}
            className="text-destructive hover:opacity-80"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await saveBrand(formData);
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Brand saved successfully");
      setShowForm(false);
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to save brand");
    }
  };

  if (showForm) {
    return (
      <div className="bg-card p-6 rounded-xl border border-border">
        <h3 className="text-lg font-semibold mb-4">{formData.id ? "Edit Brand" : "New Brand"}</h3>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium mb-1">Brand Name *</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border border-border rounded bg-background"
            />
          </div>
          <ImageUploader
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            label="Logo Image URL"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full p-2 border border-border rounded bg-background"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span className="text-sm font-medium">Is Active (Visible in Home Marquee)</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-muted text-foreground rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded font-medium disabled:opacity-50"
            >
              Save Brand
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-base">Authorized Distribution</h3>
          <p className="text-xs text-muted-foreground">
            Manage brands listed in the homepage infinite sliding marquee.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ id: "", name: "", imageUrl: "", order: 0, isActive: true });
            setShowForm(true);
          }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium text-sm flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Brand
        </button>
      </div>
      <DataTable columns={cols} rows={brands} empty="No brands configured." />
    </div>
  );
}

// Trust Badges Tab Component
function TrustBadgesTab({ settings }: { settings: any[] }) {
  const trustBadgesSetting = settings.find((s) => s.key === "trust_badges");
  const initialBadges = trustBadgesSetting ? trustBadgesSetting.value : DEFAULT_TRUST_BADGES;

  const [badges, setBadges] = useState<any[]>(initialBadges);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBadgeChange = (index: number, field: string, value: string) => {
    const updated = [...badges];
    updated[index] = { ...updated[index], [field]: value };
    setBadges(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await saveSetting("trust_badges", badges);
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Trust badges saved successfully!");
    } else {
      toast.error(res.error || "Failed to save trust badges.");
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-card p-6 rounded-xl border border-border space-y-6 max-w-3xl"
    >
      <div>
        <h3 className="text-lg font-semibold">Homepage Trust Badges</h3>
        <p className="text-xs text-muted-foreground">
          Manage the 4 informational trust highlights displayed beneath the Hero section.
        </p>
      </div>

      <div className="space-y-6">
        {badges.map((badge, idx) => (
          <div
            key={idx}
            className="p-4 bg-muted/30 border border-border rounded-xl space-y-4 relative"
          >
            <span className="absolute top-2 right-4 text-[10px] font-bold text-muted-foreground uppercase">
              Badge #{idx + 1}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">
                  Icon
                </label>
                <select
                  value={badge.icon}
                  onChange={(e) => handleBadgeChange(idx, "icon", e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-sm"
                >
                  <option value="Award">Award Icon</option>
                  <option value="ShieldCheck">Shield Check Icon</option>
                  <option value="Truck">Truck (Shipping) Icon</option>
                  <option value="RotateCcw">Rotate Arrow (Exchange) Icon</option>
                  <option value="HelpCircle">Help Circle Icon</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">
                  Title
                </label>
                <input
                  type="text"
                  value={badge.title}
                  onChange={(e) => handleBadgeChange(idx, "title", e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-sm font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={badge.subtitle}
                  onChange={(e) => handleBadgeChange(idx, "subtitle", e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-sm"
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setBadges(DEFAULT_TRUST_BADGES)}
          className="px-4 py-2 border border-border hover:bg-muted text-sm font-medium rounded-lg"
        >
          Reset to Default
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-50"
        >
          Save Trust Badges
        </button>
      </div>
    </form>
  );
}

// Newsletter & Subscriber blast Tab Component
function NewsletterTab({ subscribers }: { subscribers: any[] }) {
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [sendingBlast, setSendingBlast] = useState(false);

  const cols: Column<any>[] = [
    {
      key: "name",
      header: "Name",
      render: (s) => <span className="font-semibold text-sm">{s.name || "—"}</span>,
    },
    {
      key: "email",
      header: "Email Address",
      render: (s) => <span className="text-sm">{s.email}</span>,
    },
    {
      key: "phone",
      header: "Mobile Number",
      render: (s) => <span className="text-sm">{s.phone || "—"}</span>,
    },
    {
      key: "message",
      header: "Inquiry Message",
      render: (s) => (
        <span
          className="text-xs text-muted-foreground max-w-[200px] truncate block"
          title={s.message}
        >
          {s.message || "—"}
        </span>
      ),
    },
    {
      key: "date",
      header: "Subscribed At",
      render: (s) => (
        <span className="text-xs text-muted-foreground">
          {new Date(s.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (s) => (
        <div className="flex justify-end">
          <button
            onClick={async () => {
              if (confirm(`Remove subscriber: ${s.email}?`)) {
                await deleteSubscriber(s.id);
                toast.success("Subscriber removed successfully");
                window.location.reload();
              }
            }}
            className="text-destructive hover:opacity-80"
            title="Delete subscriber"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleSendBlast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribers.length === 0) {
      toast.error("There are no subscribers to send to.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to send this newsletter email to all ${subscribers.length} subscribers?`,
      )
    ) {
      return;
    }

    setSendingBlast(true);
    const res = await sendNewsletterBlast(subject, htmlContent);
    setSendingBlast(false);

    if (res.success) {
      toast.success(res.message || "Newsletter blast sent successfully!");
      setSubject("");
      setHtmlContent("");
    } else {
      toast.error(res.error || "Failed to send newsletter blast.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Subscribers List Column */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-base">
            Club Members & Inquiries ({subscribers.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            A list of all users registered to CosstechCom Club.
          </p>
        </div>
        <DataTable columns={cols} rows={subscribers} empty="No subscribers registered yet." />
      </div>

      {/* Compose Newsletter Blast Column */}
      <div className="bg-card p-6 rounded-xl border border-border flex flex-col justify-between">
        <form onSubmit={handleSendBlast} className="space-y-4">
          <div>
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Mail className="h-5 w-5 text-cognac" /> Compose Newsletter Blast
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send a bulk personalized HTML email campaign using SMTP.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">
                Subject *
              </label>
              <input
                required
                type="text"
                placeholder="e.g., Spring / Summer 2026 Collection Drop"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2.5 border border-border rounded bg-background text-sm"
                disabled={sendingBlast}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">
                HTML Email Body *
              </label>
              <textarea
                required
                rows={10}
                placeholder="<p>Dear Valued Customer,</p> <p>We are thrilled to announce...</p>"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full p-2.5 border border-border rounded bg-background text-sm font-mono"
                disabled={sendingBlast}
              />
              <span className="text-[10px] text-muted-foreground block mt-1">
                Supports raw HTML syntax tags. Recipient emails are processed individually.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-6">
            <button
              type="submit"
              disabled={sendingBlast || subscribers.length === 0}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:opacity-95 transition"
            >
              {sendingBlast ? (
                <>
                  <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                  Sending Email Blast...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send Blast to {subscribers.length} Subscribers
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Global Settings Tab Component
function SettingsTab({ settings }: { settings: any[] }) {
  const getVal = (key: string) => settings.find((s) => s.key === key)?.value || "";

  const [storeName, setStoreName] = useState(getVal("storeName") || "CosstechCom");
  const [contactEmail, setContactEmail] = useState(
    getVal("contactEmail") || "support@cosstechcom.com",
  );
  const [aboutUs, setAboutUs] = useState(
    getVal("aboutUs") || "Welcome to CosstechCom marketplace.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await saveSetting("storeName", storeName);
    await saveSetting("contactEmail", contactEmail);
    await saveSetting("aboutUs", aboutUs);
    setIsSubmitting(false);
    toast.success("Settings saved successfully");
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-card p-6 rounded-xl border border-border space-y-4 max-w-2xl"
    >
      <h3 className="text-lg font-semibold mb-4">Global Settings & Pages</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Store Name</label>
          <input
            required
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full p-2 border border-border rounded bg-background"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contact Email</label>
          <input
            required
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full p-2 border border-border rounded bg-background"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">About Us Text (Supports HTML)</label>
        <textarea
          rows={5}
          value={aboutUs}
          onChange={(e) => setAboutUs(e.target.value)}
          className="w-full p-2 border border-border rounded bg-background font-mono text-sm"
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary text-primary-foreground rounded font-medium disabled:opacity-50"
        >
          Save Settings
        </button>
      </div>
    </form>
  );
}

// Legal Policies Management Tab Component
function LegalTab({ settings }: { settings: any[] }) {
  const getVal = useCallback(
    (key: string) => settings.find((s) => s.key === key)?.value || "",
    [settings],
  );

  const [activeKey, setActiveKey] = useState<
    "privacyPolicy" | "termsCondition" | "deliveryPolicy" | "refundPolicy"
  >("privacyPolicy");
  const [editorVal, setEditorVal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEditorVal(getVal(activeKey));
  }, [activeKey, getVal]);

  const handleSave = async () => {
    setIsSubmitting(true);
    const res = await saveSetting(activeKey, editorVal);
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Policy updated successfully and cache purged!");
      // Reload page to reflect fresh DB settings prop in CMS UI
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to update policy");
    }
  };

  const policiesList = [
    {
      key: "privacyPolicy",
      label: "Privacy Policy",
      icon: Shield,
      desc: "Customer data collection, protection, & rights",
    },
    {
      key: "termsCondition",
      label: "Terms & Conditions",
      icon: Scale,
      desc: "E-commerce general agreement & legal terms",
    },
    {
      key: "deliveryPolicy",
      label: "Shipping & Delivery",
      icon: Truck,
      desc: "Shipping speeds, zones, rates & delays",
    },
    {
      key: "refundPolicy",
      label: "Returns & Refunds",
      icon: Info,
      desc: "Return window, refunds processing & condition",
    },
  ];

  const activePolicy = policiesList.find((p) => p.key === activeKey);
  const ActiveIcon = activePolicy?.icon || FileText;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Sidebar Selector */}
      <div className="space-y-2">
        <div className="px-3 py-2">
          <h3 className="font-semibold text-sm text-foreground">Policies Menu</h3>
          <p className="text-[11px] text-muted-foreground">Select a legal policy page to edit</p>
        </div>
        <div className="bg-card border border-border p-2 rounded-xl space-y-1 shadow-sm">
          {policiesList.map((p) => {
            const Icon = p.icon;
            const isSelected = activeKey === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setActiveKey(p.key as any)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition-colors cursor-pointer ${isSelected
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 mt-0.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground/75"}`}
                />
                <div className="min-w-0">
                  <p className="text-xs leading-snug">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground/80 leading-normal truncate">
                    {p.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between min-h-[520px] shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{activePolicy?.label}</h3>
              <p className="text-xs text-muted-foreground">
                This content is displayed publicly at{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-charcoal">
                  /
                  {activeKey === "privacyPolicy"
                    ? "privacy-policy"
                    : activeKey === "termsCondition"
                      ? "terms"
                      : activeKey === "deliveryPolicy"
                        ? "delivery-policy"
                        : "refund-policy"}
                </code>
              </p>
            </div>
          </div>

          <RichTextEditor
            value={editorVal}
            onChange={setEditorVal}
            placeholder={`Enter full content for ${activePolicy?.label} using headings, lists, bold/italic markup, and links...`}
          />
        </div>

        <div className="pt-6 border-t border-border mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm hover:opacity-95 transition"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                Saving Policy...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Announcement Bar Management Tab Component
function AnnouncementsTab({ settings }: { settings: any[] }) {
  const announcementsSetting = settings.find((s) => s.key === "announcements")?.value || {
    list: [
      "Welcome to CosstechCom Marketplace",
      "Free shipping on orders over ₹2000",
      "Top Brands. Verified Sellers. Great Deals.",
    ],
    isActive: true,
  };

  const [announcementsText, setAnnouncementsText] = useState(announcementsSetting.list.join("\n"));
  const [isActive, setIsActive] = useState(announcementsSetting.isActive);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewList = announcementsText
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await saveSetting("announcements", { list: previewList, isActive });
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Announcement settings saved successfully! Page cache purged.");
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to save settings");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Announcement Bar Marquee</h3>
            <p className="text-xs text-muted-foreground">
              Manage the infinite scrolling text strip displayed at the top of the store.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-cream/40 border border-border/80 rounded-lg">
            <div>
              <p className="text-sm font-semibold">Enable Announcement Bar</p>
              <p className="text-[11px] text-muted-foreground">
                Show or hide the marquee bar at the top of all pages.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
              Announcements (One per line)
            </label>
            <textarea
              rows={5}
              value={announcementsText}
              onChange={(e) => setAnnouncementsText(e.target.value)}
              placeholder="e.g. Free shipping over ₹2000&#10;Verified Brands & Sellers"
              className="w-full p-3 border border-border rounded-lg bg-background font-sans text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Each line will be separated by a bullet dot and scrolled infinitely.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm hover:opacity-95 transition"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                  Saving Settings...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Container */}
      {isActive && (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live Bar Preview
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              This shows how it will appear on the public storefront (pauses on hover):
            </p>
          </div>

          <div className="border border-border/80 rounded-lg overflow-hidden bg-background">
            <div className="relative overflow-hidden bg-charcoal text-cream text-[10px] tracking-[0.2em] uppercase py-2.5 flex w-full select-none border-b border-border/10">
              <div className="flex animate-marquee gap-16 whitespace-nowrap pr-16 hover:[animation-play-state:paused] cursor-pointer">
                {previewList.map((item: string, idx: number) => (
                  <span key={`p1-${idx}`} className="flex items-center gap-2">
                    <span className="opacity-75">✦</span> {item}
                  </span>
                ))}
                {/* <span className="flex items-center gap-1.5">
                  <span className="opacity-75">✦</span> Designed &amp; Developed by{" "}
                  <a
                    href="https://kuldeep.maurya-tech.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cognac hover:underline font-bold transition-all"
                  >
                    Kuldeep Maurya
                  </a>{" "}
                  from{" "}
                  <a
                    href="https://maurya-tech.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cognac hover:underline font-bold transition-all"
                  >
                    Maurya Technologies
                  </a>
                </span> */}
                <span className="flex items-center gap-1.5">
                  <span className="opacity-75">✦</span>
                  <a
                    href="https://wa.me/916263638053?text=I%20got%20contact%20from%20cosstechcom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-400 hover:underline"
                  >
                    WhatsApp Support
                  </a>
                </span>
              </div>
              <div
                className="flex animate-marquee gap-16 whitespace-nowrap pr-16 hover:[animation-play-state:paused] cursor-pointer"
                aria-hidden="true"
              >
                {previewList.map((item: string, idx: number) => (
                  <span key={`p2-${idx}`} className="flex items-center gap-2">
                    <span className="opacity-75">✦</span> {item}
                  </span>
                ))}
                {/* <span className="flex items-center gap-1.5">
                  <span className="opacity-75">✦</span> Designed &amp; Developed by{" "}
                  <a
                    href="https://kuldeep.maurya-tech.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cognac hover:underline font-bold transition-all"
                  >
                    Kuldeep Maurya
                  </a>{" "}
                  from{" "}
                  <a
                    href="https://maurya-tech.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cognac hover:underline font-bold transition-all"
                  >
                    Maurya Technologies
                  </a>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="opacity-75">✦</span>
                  <a
                    href="https://wa.me/916263638053?text=I%20got%20contact%20from%20cosstechcom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-400 hover:underline"
                  >
                    WhatsApp Support
                  </a>
                </span> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
