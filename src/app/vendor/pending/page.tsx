"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { Clock, ShieldCheck, Mail, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VendorPendingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  // If session role is approved, auto redirect
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      const vendorStatus = (session.user as any).vendorStatus;

      if (role === "vendor" && vendorStatus === "approved") {
        router.push("/vendor");
      } else if (role === "admin") {
        router.push("/admin");
      }
    }
  }, [status, session, router]);

  const handleRefreshStatus = async () => {
    setChecking(true);
    try {
      // Re-fetch nextauth session tokens to check for status updates
      await update();
    } catch (err) {
      console.error("Failed to update session status:", err);
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-xl text-center">
      <div className="mb-8">
        <Logo size={56} />
      </div>

      <div className="bg-card border border-border/85 rounded-3xl p-8 md:p-12 shadow-lg bg-white/70 backdrop-blur-md">
        <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>

        <h1 className="font-serif text-3xl font-bold text-charcoal">Application Under Review</h1>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          Thank you for applying to sell on CosstechCom! Our administration team is currently reviewing your merchant profile, GSTIN/PAN documents, and bank details.
        </p>

        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 text-left mt-8 space-y-4">
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-charcoal">Verification Process</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Verification checks typically complete within 24 to 48 business hours. We will perform verification on your bank account and GSTIN.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Mail className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-charcoal">Email Notifications</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                You will receive an onboarding notification email once your merchant dashboard is activated.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
          <button
            onClick={handleRefreshStatus}
            disabled={checking}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-xs font-bold hover:bg-primary/95 active:scale-98 transition shadow-md border border-primary/20 cursor-pointer disabled:opacity-50"
          >
            {checking ? "Checking Status..." : "Refresh Review Status"}
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full bg-background border border-input text-foreground hover:bg-muted/80 rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Marketplace</span>
        </Link>
      </div>
    </div>
  );
}
