"use client";

import { useEffect, useState } from "react";
import { Award, History, Sparkles, TrendingUp, Info } from "lucide-react";
import { formatINR, formatDate } from "@/lib/format";

interface LoyaltyLog {
  id: string;
  points: number;
  type: "EARNED" | "REDEEMED" | "REFUNDED" | "EXPIRED";
  orderId: string | null;
  description: string;
  createdAt: string;
}

export function LoyaltyDashboard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<LoyaltyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/loyalty")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load loyalty details");
        return res.json();
      })
      .then((data) => {
        setBalance(data.balance || 0);
        setHistory(data.history || []);
      })
      .catch((err) => {
        console.error("Loyalty load error:", err);
        setError("Could not retrieve loyalty points details. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-44 bg-muted rounded-2xl w-full"></div>
        <div className="h-6 bg-muted rounded w-1/4 mt-8 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
        <p className="text-sm font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-xs underline font-semibold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">Loyalty Rewards</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Track your earned points and redeem them for exclusive discounts on your next orders.
        </p>
      </div>

      {/* Hero Card / Points Balance */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-cream p-6 md:p-8 shadow-lg border border-amber-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_-20%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200/90 block">
              Available Balance
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="font-serif text-4xl md:text-5xl font-black tracking-tight">
                {balance ?? 0}
              </span>
              <span className="text-xs font-semibold text-amber-200/90">Points</span>
            </div>
            <p className="text-xs text-amber-100/80 font-medium">
              Equivalent to <span className="font-bold text-cream">{formatINR(balance ?? 0)}</span>{" "}
              off your checkout.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4.5 py-3.5 rounded-xl border border-white/10 shrink-0 self-start sm:self-auto">
            <Award className="h-6 w-6 text-amber-200" />
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold tracking-wider text-amber-200 block">
                Club Membership
              </span>
              <span className="text-[11px] text-cream font-bold block">Gold Tier Member</span>
            </div>
          </div>
        </div>
      </div>

      {/* Point Rules Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border/80 rounded-xl p-5 flex items-start gap-4 shadow-2xs">
          <div className="p-2 bg-amber-50 rounded-lg text-amber-700 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-charcoal">
              How to Earn
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Earn <span className="font-semibold text-charcoal">5% points back</span> on every
              successfully delivered order. 1 Loyalty Point = ₹1 INR.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-5 flex items-start gap-4 shadow-2xs">
          <div className="p-2 bg-amber-50 rounded-lg text-amber-700 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-charcoal">
              How to Redeem
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Apply points as direct monetary discounts at the final step of checkout. No minimum
              points required!
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-border/40">
          <History className="h-4.5 w-4.5 text-muted-foreground" />
          <h3 className="font-serif text-lg font-bold text-foreground">Transaction Log</h3>
        </div>

        {history.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground shadow-2xs">
            <Info className="h-7 w-7 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm font-semibold">No transactions recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your points transactions will show up here after order delivery.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((log) => {
              const isPositive = log.points > 0;
              const pointsDisplay = isPositive ? `+${log.points}` : `${log.points}`;

              return (
                <div
                  key={log.id}
                  className="bg-card border border-border hover:border-amber-500/20 rounded-xl p-4.5 flex items-center justify-between gap-4 transition-all shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-semibold text-xs uppercase tracking-wider text-charcoal">
                        {log.type}
                      </span>
                      {log.orderId && (
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-semibold">
                          Order #{log.orderId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-normal truncate">
                      {log.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/75 mt-1 font-medium">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`font-serif text-base font-bold ${
                        isPositive ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {pointsDisplay}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
