"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { Logo } from "@/components/shared/Logo";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, Smartphone, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  // Tab state: "email" | "phone"
  const [loginMode, setLoginMode] = useState<"email" | "phone">("email");

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Phone/OTP login state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Email and password are required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
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
        toast.error(res.error || "Invalid credentials.");
      } else {
        toast.success("Signed in successfully!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    const fullPhone = cleanPhone.startsWith("+91") ? cleanPhone : `+91${cleanPhone}`;

    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send OTP.");
        return;
      }

      setOtpSent(true);
      setOtpCooldown(60);
      toast.success("OTP sent to your phone number!");

      // Show dev OTP in non-production for testing
      if (data.devOtp) {
        toast.info(`Dev Mode OTP: ${data.devOtp}`, { duration: 15000 });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.replace(/\s+/g, "");
    const fullPhone = cleanPhone.startsWith("+91") ? cleanPhone : `+91${cleanPhone}`;

    if (!otp || otp.length < 4) {
      toast.error("Please enter the OTP sent to your phone.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("otp", {
        phone: fullPhone,
        otp,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error || "Invalid or expired OTP.");
      } else {
        toast.success("Signed in successfully!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during OTP verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 max-w-md">
      <div className="text-center mb-8">
        <Logo size={56} />
      </div>

      <div className="bg-card border border-border/80 rounded-2xl p-8 shadow-lg backdrop-blur-md bg-white/70">
        <h1 className="font-serif text-3xl font-bold text-center text-charcoal">Welcome back</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Login to your account</p>

        {/* Login Mode Tabs */}
        <div className="mt-6 flex rounded-full bg-muted/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => { setLoginMode("email"); setOtpSent(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              loginMode === "email"
                ? "bg-card text-charcoal shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-charcoal"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </button>
          <button
            type="button"
            onClick={() => setLoginMode("phone")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              loginMode === "phone"
                ? "bg-card text-charcoal shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-charcoal"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Phone OTP
          </button>
        </div>

        {/* Email Login Form */}
        {loginMode === "email" && (
          <form className="mt-5 space-y-4" onSubmit={handleEmailSubmit}>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav@example.com"
                className="mt-1.5 w-full bg-background border border-input rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
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
              className="w-full bg-primary text-primary-foreground rounded-full py-3.5 font-bold text-sm cursor-pointer disabled:opacity-50 hover:bg-primary/95 active:scale-98 transition shadow-md border border-primary/20"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {/* Phone OTP Login Form */}
        {loginMode === "phone" && (
          <form className="mt-5 space-y-4" onSubmit={handleOtpSubmit}>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Phone Number
              </span>
              <div className="relative mt-1.5">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold select-none">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setPhone(val.slice(0, 10));
                  }}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full bg-background border border-input rounded-lg pl-12 pr-3.5 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                  required
                  disabled={otpSent}
                />
              </div>
            </label>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || phone.length < 10}
                className="w-full bg-primary text-primary-foreground rounded-full py-3.5 font-bold text-sm cursor-pointer disabled:opacity-50 hover:bg-primary/95 active:scale-98 transition shadow-md border border-primary/20"
              >
                {sendingOtp ? "Sending OTP..." : "Send OTP"}
              </button>
            ) : (
              <>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Enter OTP
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setOtp(val.slice(0, 6));
                    }}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 tracking-[0.3em] text-center font-semibold"
                    autoFocus
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="w-full bg-primary text-primary-foreground rounded-full py-3.5 font-bold text-sm cursor-pointer disabled:opacity-50 hover:bg-primary/95 active:scale-98 transition shadow-md border border-primary/20"
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); }}
                    className="hover:text-charcoal underline cursor-pointer"
                  >
                    Change Number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpCooldown > 0 || sendingOtp}
                    className="hover:text-charcoal underline cursor-pointer disabled:opacity-50 disabled:no-underline"
                  >
                    {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend OTP"}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
            Or login with
          </span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-background border border-input text-foreground hover:bg-muted/80 rounded-full py-3.5 font-semibold text-sm cursor-pointer flex items-center justify-center gap-2.5 transition active:scale-98 shadow-sm"
        >
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        <p className="text-xs text-center mt-6 text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="text-primary font-bold hover:underline">
            Register
          </Link>
        </p>

        {/* Switcher links */}
        <div className="mt-8 pt-6 border-t border-border/80 flex flex-wrap justify-center gap-2.5 text-xs font-semibold text-muted-foreground">
          <span>Other Login Options:</span>
          <Link href="/login/vendor" className="text-primary hover:underline">Seller Login</Link>
          <span className="text-border">|</span>
          <Link href="/login/delivery" className="text-primary hover:underline">Delivery Partner Login</Link>
          <span className="text-border">|</span>
          <Link href="/login/admin" className="text-primary hover:underline">Admin Login</Link>
        </div>
      </div>
    </div>
  );
}

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      const vendorStatus = (session.user as any).vendorStatus;

      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        if (role === "admin") router.push("/admin");
        else if (role === "vendor") {
          if (vendorStatus !== "approved") router.push("/vendor/pending");
          else router.push("/vendor");
        }
        else if (role === "delivery_partner") router.push("/delivery");
        else if (role === "support") router.push("/support");
        else router.push("/account");
      }
    }
  }, [status, session, router, callbackUrl]);

  if (status === "authenticated") {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
