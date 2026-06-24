"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { useSettings } from "@/lib/settings-context";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const {
    storeName,
    supportEmail,
    taxRate,
    defaultReturnDays,
    shippingMethods,
    razorpayEnabled,
    codEnabled,
    loading: settingsLoading,
    refreshSettings,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<"general" | "shipping">("general");

  // Form State
  const [localStoreName, setLocalStoreName] = useState("");
  const [localSupportEmail, setLocalSupportEmail] = useState("");
  const [localTaxRate, setLocalTaxRate] = useState(8);
  const [localDefaultReturnDays, setLocalDefaultReturnDays] = useState(7);
  const [localRazorpayEnabled, setLocalRazorpayEnabled] = useState(true);
  const [localCodEnabled, setLocalCodEnabled] = useState(true);
  const [localShipping, setLocalShipping] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Load settings into local state once fetched
  useEffect(() => {
    if (!settingsLoading) {
      setLocalStoreName(storeName || "");
      setLocalSupportEmail(supportEmail || "");
      setLocalTaxRate(taxRate ?? 8);
      setLocalDefaultReturnDays(defaultReturnDays ?? 7);
      setLocalRazorpayEnabled(razorpayEnabled ?? true);
      setLocalCodEnabled(codEnabled ?? true);
      setLocalShipping(
        (shippingMethods || []).map((m) => ({
          ...m,
          priceINR: m.price,
        })),
      );
    }
  }, [
    settingsLoading,
    storeName,
    supportEmail,
    taxRate,
    defaultReturnDays,
    shippingMethods,
    razorpayEnabled,
    codEnabled,
  ]);

  const handleAddShippingMethod = () => {
    setLocalShipping((prev) => [
      ...prev,
      {
        id: `ship_${Math.random().toString(36).substring(2, 9)}`,
        name: "",
        desc: "",
        priceINR: 0,
      },
    ]);
  };

  const handleRemoveShippingMethod = (id: string) => {
    setLocalShipping((prev) => prev.filter((m) => m.id !== id));
  };

  const handleShippingChange = (id: string, field: string, value: any) => {
    setLocalShipping((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Basic validations
      if (!localStoreName.trim()) throw new Error("Store name is required");
      if (!localSupportEmail.trim()) throw new Error("Support email is required");
      if (isNaN(localTaxRate) || localTaxRate < 0)
        throw new Error("Tax rate must be a valid positive number");
      if (isNaN(localDefaultReturnDays) || localDefaultReturnDays < 0)
        throw new Error("Default return period must be a valid positive number");

      // Payment gateway validations
      if (!localRazorpayEnabled && !localCodEnabled) {
        throw new Error("At least one payment method must be enabled");
      }

      // Validate shipping methods
      for (const m of localShipping) {
        if (!m.name.trim()) throw new Error("All shipping methods must have a name");
        if (!m.desc.trim())
          throw new Error("All shipping methods must have a delivery description");
        if (isNaN(m.priceINR) || m.priceINR < 0)
          throw new Error("Shipping prices must be valid positive numbers");
      }

      // Format shipping methods back
      const formattedShipping = localShipping.map((m) => ({
        id: m.id,
        name: m.name.trim(),
        desc: m.desc.trim(),
        price: Number(m.priceINR),
      }));

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: localStoreName.trim(),
          supportEmail: localSupportEmail.trim(),
          taxRate: Number(localTaxRate),
          defaultReturnDays: Number(localDefaultReturnDays),
          razorpayEnabled: localRazorpayEnabled,
          codEnabled: localCodEnabled,
          shippingMethods: formattedShipping,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");

      toast.success("Configuration saved successfully!");
      await refreshSettings();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading && localStoreName === "") {
    return (
      <DashboardPage eyebrow="Configuration" title="Settings">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage eyebrow="Configuration" title="Settings">
      <div className="max-w-4xl space-y-6">
        {/* Modern Tabs Navigation */}
        <div className="flex border-b border-border gap-2 pb-px">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap -mb-px cursor-pointer ${
              activeTab === "general"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap -mb-px cursor-pointer ${
              activeTab === "shipping"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Shipping Methods
          </button>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* General Tab */}
          {activeTab === "general" && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
              <h3 className="font-serif text-lg font-bold border-b border-border pb-3">
                Store Configuration
              </h3>

              <div className="grid md:grid-cols-2 gap-5">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Store Name
                  </span>
                  <input
                    type="text"
                    value={localStoreName}
                    onChange={(e) => setLocalStoreName(e.target.value)}
                    required
                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Support Email
                  </span>
                  <input
                    type="email"
                    value={localSupportEmail}
                    onChange={(e) => setLocalSupportEmail(e.target.value)}
                    required
                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Est. Tax Rate (%)
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      value={localTaxRate}
                      onChange={(e) => setLocalTaxRate(Number(e.target.value))}
                      min="0"
                      max="100"
                      step="0.1"
                      required
                      className="w-full bg-background border border-input rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      %
                    </span>
                  </div>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Default Return Period (Days)
                  </span>
                  <input
                    type="number"
                    value={localDefaultReturnDays}
                    onChange={(e) => setLocalDefaultReturnDays(Number(e.target.value))}
                    min="0"
                    max="365"
                    required
                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                  />
                </label>

                <div className="bg-muted/30 border border-border rounded-xl p-4 flex flex-col justify-center text-xs text-muted-foreground leading-relaxed md:col-span-2">
                  <p className="font-semibold text-foreground mb-1">Configuration Calculations</p>
                  Taxes are calculated based on the Est. Tax Rate (%). If a specific product does
                  not specify its own Return Policy, the store-wide Default Return Period (Days) is
                  applied.
                </div>

                {/* Dynamic Payment Gateways Toggles */}
                <div className="md:col-span-2 border-t border-border pt-6 mt-4 space-y-4">
                  <div>
                    <h4 className="font-serif text-base font-bold text-foreground mb-1">
                      Payment Gateways & Methods
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Configure which payment methods are accepted and shown on the customer
                      checkout page.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Razorpay Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/10 border border-border rounded-xl hover:bg-muted/20 transition-all duration-300">
                      <div className="pr-4">
                        <span className="block font-bold text-xs uppercase tracking-wider text-foreground mb-1">
                          Pay Online (Razorpay)
                        </span>
                        <span className="block text-[11px] text-muted-foreground leading-normal">
                          Allow customers to pay instantly using cards, net banking, UPI, and
                          digital wallets.
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={localRazorpayEnabled}
                          onChange={(e) => setLocalRazorpayEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {/* COD Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/10 border border-border rounded-xl hover:bg-muted/20 transition-all duration-300">
                      <div className="pr-4">
                        <span className="block font-bold text-xs uppercase tracking-wider text-foreground mb-1">
                          Cash On Delivery (COD)
                        </span>
                        <span className="block text-[11px] text-muted-foreground leading-normal">
                          Enable customers to complete purchase checkout and pay in cash upon
                          receiving the order.
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={localCodEnabled}
                          onChange={(e) => setLocalCodEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Methods Tab */}
          {activeTab === "shipping" && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="font-serif text-lg font-bold">Shipping Delivery Methods</h3>
                <button
                  type="button"
                  onClick={handleAddShippingMethod}
                  className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3.5 py-2 rounded-full font-semibold transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Option
                </button>
              </div>

              {localShipping.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                  No shipping methods configured. Customers will not be able to checkout. Click "Add
                  Option" to configure.
                </div>
              ) : (
                <div className="space-y-4">
                  {localShipping.map((method, idx) => (
                    <div
                      key={method.id}
                      className="bg-muted/10 border border-border rounded-xl p-4 md:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
                        <label className="block space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Method Name *
                          </span>
                          <input
                            type="text"
                            value={method.name}
                            onChange={(e) =>
                              handleShippingChange(method.id, "name", e.target.value)
                            }
                            placeholder="e.g. Express Delivery"
                            required
                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                          />
                        </label>

                        <label className="block space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Estimated Delivery *
                          </span>
                          <input
                            type="text"
                            value={method.desc}
                            onChange={(e) =>
                              handleShippingChange(method.id, "desc", e.target.value)
                            }
                            placeholder="e.g. 2–3 business days"
                            required
                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                          />
                        </label>

                        <label className="block space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Cost (INR ₹) *
                          </span>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={method.priceINR}
                              onChange={(e) =>
                                handleShippingChange(method.id, "priceINR", Number(e.target.value))
                              }
                              min="0"
                              placeholder="0 for Free"
                              required
                              className="w-full bg-background border border-input rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                            />
                          </div>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveShippingMethod(method.id)}
                        className="text-destructive hover:bg-destructive/10 p-2.5 rounded-full transition cursor-pointer self-end md:self-auto"
                        title="Delete shipping method"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-full px-7 py-3 text-sm font-semibold cursor-pointer disabled:opacity-50 transition shadow"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving configurations..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </DashboardPage>
  );
}
