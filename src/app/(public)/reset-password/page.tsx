"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Logo } from "@/components/shared/Logo";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Password reset token is missing from the link.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success("Password reset successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please request another reset link.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 shadow-card text-center space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 grain opacity-20" />
        <div className="h-12 w-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h1 className="font-serif text-2xl font-bold text-charcoal">Invalid Reset Link</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The password reset link is invalid or is missing a secure token parameters.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block bg-primary text-primary-foreground rounded-full px-6 py-2.5 font-semibold text-xs cursor-pointer hover:bg-primary/95 transition"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-card relative overflow-hidden">
      <div className="absolute inset-0 grain opacity-20" />
      <h1 className="font-serif text-3xl font-bold text-center text-charcoal">Reset password</h1>
      <p className="text-sm text-muted-foreground text-center mt-2">
        Enter and confirm your new password below.
      </p>

      <form className="mt-6 space-y-4 relative" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            New Password
          </span>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background border border-input rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
              disabled={loading}
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

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Confirm Password
          </span>
          <div className="relative mt-1.5">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background border border-input rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold text-sm cursor-pointer disabled:opacity-50 hover:bg-primary/95 transition duration-200 mt-2 flex items-center justify-center gap-2"
        >
          {loading ? "Resetting password..." : "Reset Password"}
        </button>
      </form>

      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-border"></div>
      </div>

      <div className="text-center relative">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline transition"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24 max-w-md">
      <div className="text-center mb-8">
        <Logo size={56} />
      </div>
      <Suspense
        fallback={
          <div className="bg-card border border-border rounded-2xl p-8 shadow-card text-center py-20 relative">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
