"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { Logo } from "@/components/shared/Logo";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, ShieldAlert } from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

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
        toast.success("Administrator signed in successfully!");
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-md">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      <div className="text-center mb-8">
        <Logo size={56} />
      </div>

      <div className="bg-card border border-red-200/60 rounded-2xl p-8 shadow-xl backdrop-blur-md bg-white/70">
        <div className="flex items-center justify-center gap-2 mb-2 text-red-600 font-bold">
          <ShieldAlert className="h-5 w-5 text-red-600 animate-pulse" />
          <span className="text-xs uppercase tracking-widest">Console Admin</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-center text-charcoal">Administrative Portal</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Sign in to console control center</p>

        {/* Warning banner */}
        <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl text-[11px] text-red-700 leading-relaxed mt-6">
          <strong>WARNING:</strong> This is a secure system. Unauthorized access or attempt is strictly prohibited and subject to auditing and administrative actions.
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Console Username/Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cosstechcom.com"
              className="mt-1.5 w-full bg-background border border-input rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Security Password
            </span>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-input rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
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
            className="w-full bg-red-700 hover:bg-red-800 text-cream rounded-full py-3.5 font-bold text-sm cursor-pointer disabled:opacity-50 active:scale-98 transition shadow-md border border-red-850 mt-2"
          >
            {loading ? "Authenticating Admin..." : "Access Admin Console"}
          </button>
        </form>

        {/* Switcher links */}
        <div className="mt-8 pt-6 border-t border-border/60 flex flex-wrap justify-center gap-2.5 text-xs font-semibold text-muted-foreground">
          <span>Access Other Portals:</span>
          <Link href="/login" className="text-primary hover:underline">Customer Portal</Link>
          <span className="text-border">|</span>
          <Link href="/login/vendor" className="text-primary hover:underline">Merchant Portal</Link>
          <span className="text-border">|</span>
          <Link href="/login/delivery" className="text-primary hover:underline">Logistics Agent</Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
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
      <AdminLoginForm />
    </Suspense>
  );
}
