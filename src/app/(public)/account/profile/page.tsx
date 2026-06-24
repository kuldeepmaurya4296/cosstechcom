"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Lock,
  Key,
  Save,
  LogOut,
  Sparkles,
  Info,
} from "lucide-react";

export default function AccountProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [joinedAt, setJoinedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    setLoading(true);
    fetch("/api/user/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile details");
        return res.json();
      })
      .then((data) => {
        if (data.success && data.user) {
          setName(data.user.name || "");
          setEmail(data.user.email || "");
          setPhone(data.user.phone || "");
          setJoinedAt(data.user.createdAt || "");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load profile details.");
      })
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      if (data.success && data.user) {
        setName(data.user.name);
        setPhone(data.user.phone);

        // Refresh session
        await update();
        toast.success("Profile updated successfully!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong while saving changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-44 bg-muted rounded-lg"></div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 h-[300px]"></div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 h-[220px]"></div>
        </div>
      </div>
    );
  }

  const initials = name
    ? name
        .split(" ")
        .filter(Boolean)
        .map((s) => s[0])
        .join("")
        .toUpperCase()
    : "U";

  const memberYear = joinedAt ? new Date(joinedAt).getFullYear() : new Date().getFullYear();
  const memberSinceStr = joinedAt
    ? new Date(joinedAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "June 2026";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">Profile Settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your personal information and account security details
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Left Form Column */}
        <div className="md:col-span-2 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-4 pb-5 border-b border-border/60">
              <div className="h-16 w-16 rounded-full bg-brass/20 text-brass flex items-center justify-center font-serif text-xl font-bold border-2 border-brass/20">
                {initials}
              </div>
              <div>
                <p className="font-bold text-base text-foreground">{name || "User Profile"}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Member since {memberSinceStr}</span>
                </div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brass/15 focus:border-brass transition font-medium text-foreground"
                    required
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/40">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-muted/60 border border-input/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed font-medium"
                    placeholder="name@example.com"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>
                    Email address cannot be changed. Contact support to update your login email.
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
                  Mobile / Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-background border border-input rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brass/15 focus:border-brass transition font-medium text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Actions Button Group */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/40">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-cognac text-primary-foreground font-bold rounded-full px-6 py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-0 disabled:opacity-50 w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <div className="h-3.5 w-3.5 border-t-2 border-r-2 border-primary-foreground rounded-full animate-spin"></div>
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-background border border-input text-foreground hover:bg-muted font-bold rounded-full px-6 py-2.5 text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                <LogOut className="h-3.5 w-3.5 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security & Preferences Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-foreground pb-3 border-b border-border/60">
              <ShieldCheck className="h-4.5 w-4.5 text-brass" />
              <h3 className="font-bold text-sm">Account Security</h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-green-500/10 text-green-700 rounded-lg shrink-0">
                  <Key className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Verified Session</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                    You are securely authenticated. Your sessions are encrypted.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">NextAuth Provider</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                    Login handled securely via server-side session credentials.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/40 rounded-xl p-3.5 border border-border/40 text-[10px] text-muted-foreground space-y-1.5">
              <p className="font-bold text-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-brass" />
                <span>Style Haven Security Tip</span>
              </p>
              <p className="leading-relaxed">
                Never share your login details or OTPs with anyone. We will never ask for your
                account password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
