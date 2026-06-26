"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { Logo } from "@/components/shared/Logo";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, ShieldCheck, TrendingUp, BarChart3, Store } from "lucide-react";

function VendorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/vendor";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const checkRes = await fetch("/api/auth/login-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        toast.error(checkData.error || "Login validation failed.");
        setLoading(false);
        return;
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error || "Invalid login credentials.");
      } else {
        toast.success("Merchant logged in successfully!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl">
      <div className="mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Portals</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Informational Column (Left) */}
        <div className="lg:col-span-6 bg-charcoal text-cream rounded-3xl p-8 md:p-12 flex flex-col justify-between border border-charcoal/10 relative overflow-hidden shadow-xl min-h-[400px]">
          <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-charcoal to-cognac/35 opacity-90 z-0" />
          <div className="absolute inset-0 grain opacity-10 z-0" />
          
          <div className="relative z-10">
            <Logo size={48} className="invert brightness-0" />
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight mt-8 leading-tight">
              Grow your shoe business online with CosstechCom
            </h2>
            <p className="text-cream/80 text-sm mt-4 leading-relaxed">
              Access millions of verified customers across India. Leverage our logistics network, automated tax calculations, and fast settlement cycles.
            </p>
          </div>

          <div className="relative z-10 space-y-6 mt-8">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-cream/10 border border-cream/25 grid place-items-center shrink-0">
                <TrendingUp className="h-5 w-5 text-brass" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-cream">Industry-Best 10% Commission</h4>
                <p className="text-xs text-cream/70 mt-1">Keep more of your margins with our open-marketplace pricing model.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-cream/10 border border-cream/25 grid place-items-center shrink-0">
                <BarChart3 className="h-5 w-5 text-brass" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-cream">Real-time Sales & Payout Analytics</h4>
                <p className="text-xs text-cream/70 mt-1">Track conversions, manage inventory status, and receive seamless payouts.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-cream/10 border border-cream/25 grid place-items-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-brass" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-cream">Secure Merchant Shield</h4>
                <p className="text-xs text-cream/70 mt-1">Strict logistics mediation and prompt payout settlements with complete security.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column (Right) */}
        <div className="lg:col-span-6 bg-card border border-border/80 rounded-3xl p-8 md:p-12 shadow-lg flex flex-col justify-center bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 text-primary font-bold">
            <Store className="h-5 w-5 text-cognac" />
            <span className="text-xs uppercase tracking-widest text-cognac">Merchant Portal</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-charcoal">Seller Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your shop, listings, and customer orders</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Merchant Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor.electronics@cosstechcom.com"
                className="mt-1.5 w-full bg-background border border-input rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                required
              />
            </label>
            <label className="block">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </span>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-input rounded-xl pl-4 pr-10 py-3 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-bold text-sm cursor-pointer disabled:opacity-50 hover:bg-primary/95 active:scale-98 transition shadow-md border border-primary/20 mt-2"
            >
              {loading ? "Verifying Credentials..." : "Access Merchant Dashboard"}
            </button>
          </form>

          <p className="text-xs text-center mt-6 text-muted-foreground">
            Want to sell on CosstechCom?{" "}
            <Link href="/vendor/register" className="text-primary font-bold hover:underline">
              Register your store
            </Link>
          </p>

          {/* Switcher links */}
          <div className="mt-8 pt-6 border-t border-border/60 flex flex-wrap justify-center gap-2.5 text-xs font-semibold text-muted-foreground">
            <span>Access Other Portals:</span>
            <Link href="/login" className="text-primary hover:underline">Customer Portal</Link>
            <span className="text-border">|</span>
            <Link href="/login/delivery" className="text-primary hover:underline">Logistics Agent</Link>
            <span className="text-border">|</span>
            <Link href="/login/admin" className="text-primary hover:underline">Console Control</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      if (role === "admin") router.push("/admin");
      else if (role === "vendor") router.push("/vendor");
      else if (role === "delivery_partner") router.push("/delivery");
      else if (role === "support") router.push("/support");
      else router.push("/account");
    }
  }, [status, session, router]);

  if (status === "authenticated") {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
        </div>
      }
    >
      <VendorLoginForm />
    </Suspense>
  );
}
