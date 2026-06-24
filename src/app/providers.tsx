"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/lib/cart-store";
import { SessionProvider } from "next-auth/react";
import { useState, useEffect } from "react";
import { SettingsProvider } from "@/lib/settings-context";
import { ThemeProvider } from "@/components/public/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Reuse fetched data for 60s before refetching; don't refetch on
            // window focus. Cuts redundant API hits and lets the CDN cache help.
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("Service Worker registered with scope:", reg.scope))
          .catch((err) => console.error("Service Worker registration failed:", err));
      });
    }
  }, []);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <ThemeProvider>
            <CartProvider>{children}</CartProvider>
          </ThemeProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
