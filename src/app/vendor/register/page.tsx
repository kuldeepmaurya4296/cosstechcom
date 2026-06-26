"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { ArrowLeft, Store, MapPin, Building, CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";

export default function VendorRegisterPage() {
  const router = useRouter();
  const { data: session, update } = useSession();

  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  
  // Bank Account State
  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !storeName.trim() ||
      !businessAddress.trim() ||
      !gstNumber.trim() ||
      !panNumber.trim() ||
      !holderName.trim() ||
      !bankName.trim() ||
      !accountNumber.trim() ||
      !ifscCode.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/vendor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          storeDescription,
          businessAddress,
          gstNumber,
          panNumber,
          bankAccount: {
            holderName,
            bankName,
            accountNumber,
            ifscCode,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Onboarding failed");
      }

      toast.success("Merchant profile submitted successfully! Your application is under review.");
      
      // Update nextauth session to refresh roles
      await update();
      
      router.push("/vendor/pending");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred during vendor onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-3xl">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Marketplace</span>
        </Link>
        <Logo size={40} />
      </div>

      <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-10 shadow-lg bg-white/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5 mb-2 text-cognac font-bold">
          <Store className="h-6 w-6 text-cognac animate-pulse" />
          <span className="text-sm uppercase tracking-widest">Store Onboarding</span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-charcoal">Sell on CosstechCom</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Fill in your business details below to create your merchant store profile and submit your KYC documents for verification.
        </p>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          {/* Section 1: Store profile */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-charcoal border-b border-border/40 pb-2 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-brass" />
              <span>1. Store Brand Details</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Store / Brand Name *
                </span>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Apex Footwear"
                  className="mt-1.5 w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                  required
                />
              </label>
              
              <label className="block md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Store Description
                </span>
                <textarea
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Premium handcrafted leather boots and formal shoe collections..."
                  rows={3}
                  className="mt-1.5 w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition resize-none"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Business & Tax details */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-charcoal border-b border-border/40 pb-2 flex items-center gap-2">
              <Building className="h-4.5 w-4.5 text-brass" />
              <span>2. Legal Business Registrations</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Registered Business Address *
                </span>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="101 Commercial Hub, Ring Road, New Delhi"
                    className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                    required
                  />
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  GSTIN / Tax Registration Number *
                </span>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  placeholder="07AAAAA1111A1Z1"
                  className="mt-1.5 w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  PAN Number *
                </span>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="mt-1.5 w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                  required
                />
              </label>
            </div>
          </div>

          {/* Section 3: Bank Account */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-charcoal border-b border-border/40 pb-2 flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-brass" />
              <span>3. Settlements Bank Account</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Account Holder Name *
                </span>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="Apex Footwear Pvt Ltd"
                  className="mt-1.5 w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bank Name *
                </span>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="HDFC Bank"
                  className="mt-1.5 w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Account Number *
                </span>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="50100203040506"
                  className="mt-1.5 w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  IFSC Code *
                </span>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="HDFC0000123"
                  className="mt-1.5 w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                  required
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-xl py-4 font-bold text-sm cursor-pointer disabled:opacity-50 hover:bg-primary/95 active:scale-98 transition shadow-md border border-primary/20 mt-4"
          >
            {loading ? "Registering Store..." : "Submit Store Profile & Apply"}
          </button>
        </form>
      </div>
    </div>
  );
}
