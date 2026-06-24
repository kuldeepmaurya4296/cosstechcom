"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MapPin, Plus, Trash2, Edit2, X } from "lucide-react";
import { toast } from "sonner";

interface Address {
  _id?: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pin: string;
  isDefault: boolean;
}

export default function AccountAddressesPage() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("Home");
  const [customLabel, setCustomLabel] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pin, setPin] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = useCallback(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    fetch("/api/user/addresses")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch addresses");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setAddresses(data);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load addresses.");
      })
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setLabel("Home");
    setCustomLabel("");
    setFullName(session?.user?.name || "");
    setPhone("");
    setLine1("");
    setLine2("");
    setCity("");
    setState("");
    setPin("");
    setIsDefault(addresses.length === 0);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingId(addr._id || null);
    const standardLabels = ["Home", "Work", "Office"];
    if (standardLabels.includes(addr.label)) {
      setLabel(addr.label);
      setCustomLabel("");
    } else {
      setLabel("Other");
      setCustomLabel(addr.label);
    }
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setLine1(addr.line1);
    setLine2(addr.line2 || "");
    setCity(addr.city);
    setState(addr.state);
    setPin(addr.pin);
    setIsDefault(addr.isDefault);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalLabel = label === "Other" ? customLabel : label;

    if (!finalLabel || !fullName || !phone || !line1 || !city || !state || !pin) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label: finalLabel,
        fullName,
        phone,
        line1,
        line2,
        city,
        state,
        pin,
        isDefault,
      };

      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...payload } : payload;

      const res = await fetch("/api/user/addresses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save address");

      setAddresses(data);
      setIsFormOpen(false);
      toast.success(editingId ? "Address updated successfully!" : "Address added successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred while saving address.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete address");

      setAddresses(data);
      toast.success("Address removed successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred while deleting address.");
    }
  };

  if (loading && addresses.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-muted rounded"></div>
          <div className="h-9 w-24 bg-muted rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 h-[160px]"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-2xl font-bold">Addresses</h2>
        <button
          onClick={handleOpenAdd}
          className="bg-primary text-primary-foreground hover:bg-primary/95 rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow transition"
        >
          <Plus className="h-4 w-4" /> Add new
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground shadow-sm">
          <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
          <p className="font-semibold text-base mb-1">No addresses saved yet</p>
          <p className="text-sm text-muted-foreground/80 max-w-xs mx-auto mb-4">
            Save your shipping addresses for a faster checkout experience.
          </p>
          <button
            onClick={handleOpenAdd}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-primary/95 transition cursor-pointer"
          >
            Add your first address
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div
              key={a._id}
              className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-primary/50 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cognac" />
                    <span className="font-semibold text-sm">{a.label}</span>
                  </div>
                  {a.isDefault && (
                    <span className="text-[9px] tracking-wider uppercase font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>

                <p className="mt-3 font-semibold text-sm text-foreground">{a.fullName}</p>

                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {a.line1}
                  {a.line2 && (
                    <>
                      <br />
                      {a.line2}
                    </>
                  )}
                  <br />
                  {a.city}, {a.state} - {a.pin}
                </p>
                <p className="mt-2 text-xs text-muted-foreground font-medium">Phone: {a.phone}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex justify-between items-center text-xs w-full min-h-[36px]">
                {deleteConfirmId === a._id ? (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 w-full justify-between animate-in fade-in duration-150">
                    <span className="font-semibold text-red-700">Delete address?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleDelete(a._id!);
                          setDeleteConfirmId(null);
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-2.5 py-1 rounded font-semibold transition cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="bg-background border border-input text-foreground hover:bg-muted px-2.5 py-1 rounded font-semibold transition cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleOpenEdit(a)}
                      className="underline hover:text-primary font-semibold cursor-pointer flex items-center gap-1 text-muted-foreground transition-colors"
                    >
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(a._id!)}
                      className="underline hover:text-destructive font-semibold cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <h3 className="font-serif text-lg font-bold">
                {editingId ? "Edit Address" : "Add New Address"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block col-span-2 sm:col-span-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Address Label *
                  </span>
                  <select
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                {label === "Other" && (
                  <label className="block col-span-2 sm:col-span-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Custom Label *
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Parents' house"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                      required
                    />
                  </label>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Full Name *
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Recipient's name"
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Phone Number *
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Address Line 1 *
                </span>
                <input
                  type="text"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Flat, House no., Building, Apartment"
                  className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Address Line 2 (Optional)
                </span>
                <input
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Area, Street, Sector, Village"
                  className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                />
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="block col-span-3 sm:col-span-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    City *
                  </span>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                    required
                  />
                </label>

                <label className="block col-span-3 sm:col-span-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    State *
                  </span>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                    required
                  />
                </label>

                <label className="block col-span-3 sm:col-span-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    PIN Code *
                  </span>
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="6 digits"
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                    required
                  />
                </label>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-sm font-medium text-foreground select-none">
                    Set as default address
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border mt-6 bg-muted/10 -mx-6 -mb-6 p-6 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-background border border-input text-foreground hover:bg-muted rounded-full px-5 py-2 text-sm font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 rounded-full px-6 py-2 text-sm font-semibold cursor-pointer disabled:opacity-50 transition shadow"
                >
                  {saving ? "Saving..." : editingId ? "Update Address" : "Add Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
