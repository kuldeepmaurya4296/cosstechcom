"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { Logo } from "@/components/shared/Logo";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Truck, Phone, Lock } from "lucide-react";

function DeliveryLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/delivery";

  const [activeTab, setActiveTab] = useState<"otp" | "password">("otp");
  
  // OTP Form States
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  
  // Password Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      toast.success("OTP sent to your registered phone number!");
      setOtpSent(true);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong sending OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !otp.trim()) {
      toast.error("Phone number and OTP are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("otp", {
        phone,
        otp,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error || "Invalid OTP code.");
      } else {
        toast.success("Signed in successfully!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
        toast.success("Delivery partner signed in successfully!");
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
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Login Options</span>
        </Link>
      </div>

      <div className="text-center mb-8">
        <Logo size={56} />
      </div>

      <div className="bg-card border border-border/80 rounded-2xl p-8 shadow-lg backdrop-blur-md bg-white/70">
        <div className="flex items-center justify-center gap-2 mb-2 text-cognac font-bold">
          <Truck className="h-5 w-5 text-cognac" />
          <span className="text-xs uppercase tracking-widest">Delivery Partner Portal</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-center text-charcoal">Delivery Partner</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Accept deliveries & track earnings</p>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-xl mt-6 border border-border/50">
          <button
            type="button"
            onClick={() => setActiveTab("otp")}
            className={`py-2 text-xs font-bold rounded-lg transition duration-200 cursor-pointer ${
              activeTab === "otp"
                ? "bg-white text-charcoal shadow-sm"
                : "text-muted-foreground hover:text-charcoal"
            }`}
          >
            OTP Verification
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("password")}
            className={`py-2 text-xs font-bold rounded-lg transition duration-200 cursor-pointer ${
              activeTab === "password"
                ? "bg-white text-charcoal shadow-sm"
                : "text-muted-foreground hover:text-charcoal"
            }`}
          >
            Password Login
          </button>
        </div>

        {activeTab === "otp" ? (
          <div className="mt-6 space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Registered Mobile Number
                  </span>
                  <div className="relative mt-1.5">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full bg-background border border-input rounded-lg pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                      required
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full bg-primary text-primary-foreground rounded-full py-3.5 font-bold text-sm cursor-pointer hover:bg-primary/95 active:scale-98 transition shadow-md border border-primary/20"
                >
                  {sendingOtp ? "Requesting OTP..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="bg-brass/5 border border-brass/15 p-3 rounded-xl flex items-center justify-between text-xs text-cognac">
                  <span>Code sent to {phone}</span>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="underline font-bold hover:text-charcoal cursor-pointer"
                  >
                    Change
                  </button>
                </div>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    One-Time Password (OTP)
                  </span>
                  <div className="relative mt-1.5">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full bg-background border border-input rounded-lg pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                      required
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground rounded-full py-3.5 font-bold text-sm cursor-pointer hover:bg-primary/95 active:scale-98 transition shadow-md border border-primary/20"
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Partner Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="delivery.partner1@cosstechcom.com"
                className="mt-1.5 w-full bg-background border border-input rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </span>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-input rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
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
              className="w-full bg-primary text-primary-foreground rounded-full py-3.5 font-bold text-sm cursor-pointer hover:bg-primary/95 active:scale-98 transition shadow-md border border-primary/20"
            >
              {loading ? "Signing in..." : "Sign In with Password"}
            </button>
          </form>
        )}

        {/* Switcher links */}
        <div className="mt-8 pt-6 border-t border-border/60 flex flex-wrap justify-center gap-2.5 text-xs font-semibold text-muted-foreground">
          <span>Access Other Portals:</span>
          <Link href="/login" className="text-primary hover:underline">Customer Portal</Link>
          <span className="text-border">|</span>
          <Link href="/login/vendor" className="text-primary hover:underline">Merchant Portal</Link>
          <span className="text-border">|</span>
          <Link href="/login/admin" className="text-primary hover:underline">Console Control</Link>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryLoginPage() {
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
      <DeliveryLoginForm />
    </Suspense>
  );
}
