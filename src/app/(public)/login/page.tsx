"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Logo } from "@/components/shared/Logo";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validations
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
      // 1. Perform detailed server-side pre-login validations
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

      // 2. If validation succeeded, perform the actual NextAuth sign-in
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error || "Invalid login credentials.");
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

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24 max-w-md">
      <div className="text-center mb-8">
        <Logo size={56} />
      </div>
      <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
        <h1 className="font-serif text-3xl font-bold text-center">Welcome back</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Sign in to your account</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aarav@example.com"
              className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm"
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
                className="w-full bg-background border border-input rounded-lg pl-3 pr-10 py-2.5 text-sm"
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
            className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold text-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase tracking-wider">
            Or
          </span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-background border border-input text-foreground hover:bg-muted rounded-full py-3 font-semibold text-sm cursor-pointer flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
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
          Sign in with Google
        </button>

        <p className="text-xs text-center mt-5 text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="text-primary font-semibold underline">
            Create an account
          </Link>
        </p>
      </div>
      <div className="mt-6 flex justify-center gap-4 text-xs">
        <Link href="/account" className="underline">
          Customer portal
        </Link>
        <Link href="/admin" className="underline">
          Admin
        </Link>
        {/* <Link href="/vendor" className="underline">Vendor</Link> */}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { status } = useSession();

  if (status === "authenticated") {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="mb-4">You are already logged in.</p>
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
      <LoginForm />
    </Suspense>
  );
}
