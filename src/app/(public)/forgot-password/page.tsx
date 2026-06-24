"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSubmitted(true);
      toast.success("Password reset request sent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24 max-w-md">
      <div className="text-center mb-8">
        <Logo size={56} />
      </div>
      <div className="bg-card border border-border rounded-2xl p-8 shadow-card relative overflow-hidden">
        <div className="absolute inset-0 grain opacity-20" />

        {!submitted ? (
          <>
            <h1 className="font-serif text-3xl font-bold text-center text-charcoal">
              Forgot password
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-2 leading-relaxed">
              Enter your registered email address and we'll send you a link to reset your password.
            </p>
            <form className="mt-6 space-y-4 relative" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </span>
                <div className="relative mt-1.5">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aarav@example.com"
                    className="w-full bg-background border border-input rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground pointer-events-none">
                    <Mail className="h-4 w-4" />
                  </div>
                </div>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold text-sm cursor-pointer disabled:opacity-50 hover:bg-primary/95 transition duration-200 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? "Sending reset link..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4 relative">
            <div className="h-12 w-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h1 className="font-serif text-2xl font-bold text-charcoal">Check your inbox</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If an account is associated with <strong className="text-charcoal">{email}</strong>,
              we have sent instructions to reset your password.
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/50 p-2.5 rounded-lg">
              Note: The link is valid for 1 hour. Please check your spam folder if you don't receive
              it shortly.
            </p>
          </div>
        )}

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
    </div>
  );
}
