"use client";

import React, { useEffect, useState } from "react";
import { Share2, Users, Gift, Copy, Check, Loader2, Sparkles, TrendingUp, Info } from "lucide-react";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface ReferralLog {
  id: string;
  friendName: string;
  friendEmail: string;
  reward: number;
  status: "pending" | "completed" | "expired";
  createdAt: string;
}

export function ReferralDashboard() {
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrals, setReferrals] = useState<ReferralLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetch("/api/user/referrals")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load referrals");
        return res.json();
      })
      .then((data) => {
        setReferralCode(data.referralCode || "");
        setReferrals(data.referrals || []);
      })
      .catch((err) => {
        console.error("Referral load error:", err);
        setError("Could not retrieve referrals. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : `https://cosstechcom.com/signup?ref=${referralCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success("Referral code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Referral signup link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

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

  const completedCount = referrals.filter(r => r.status === "completed").length;
  const pendingCount = referrals.filter(r => r.status === "pending").length;
  const totalEarnings = completedCount * 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">Refer &amp; Earn</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Share your love for luxury and quality. Refer your friends and get rewarded in your wallet.
        </p>
      </div>

      {/* Hero Card / Share referral code */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-cream p-6 md:p-8 shadow-lg border border-emerald-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_-20%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
        <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 block">
                Total Referral Rewards
              </span>
              <span className="font-serif text-4xl md:text-5xl font-black tracking-tight block">
                {formatINR(totalEarnings)}
              </span>
            </div>
            <div className="flex gap-4 text-xs text-emerald-100">
              <div>
                <span className="font-bold text-cream">{completedCount}</span> Successful
              </div>
              <div className="border-l border-emerald-500/30 pl-4">
                <span className="font-bold text-cream">{pendingCount}</span> Pending
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10">
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-200 block">
                Your Referral Code
              </span>
              <div className="flex items-center justify-between gap-3 mt-1.5 bg-black/10 p-2.5 rounded-xl border border-white/5">
                <code className="font-mono text-sm font-bold tracking-wider text-cream">
                  {referralCode}
                </code>
                <button
                  onClick={copyCode}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-200 hover:text-cream transition cursor-pointer"
                  title="Copy Code"
                >
                  {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-200 block">
                Referral Link
              </span>
              <div className="flex items-center justify-between gap-3 mt-1.5 bg-black/10 p-2.5 rounded-xl border border-white/5">
                <span className="text-[11px] truncate text-emerald-100 max-w-[200px]">
                  {referralLink}
                </span>
                <button
                  onClick={copyLink}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-200 hover:text-cream transition cursor-pointer"
                  title="Copy Link"
                >
                  {copiedLink ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Info */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border/80 rounded-xl p-5 flex flex-col gap-3 shadow-2xs">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700 self-start">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-charcoal">
              1. Invite Friends
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              Share your custom code or direct registration link with your network.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-5 flex flex-col gap-3 shadow-2xs">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700 self-start">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-charcoal">
              2. Friend Registers
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              Your referred friend gets ₹100 signup wallet bonus added to their account pending verification.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-5 flex flex-col gap-3 shadow-2xs">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700 self-start">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-charcoal">
              3. Earn Credits
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              Once your friend receives their first delivered order, both your ₹100 rewards are fully credited!
            </p>
          </div>
        </div>
      </div>

      {/* Referred list */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-border/40">
          <Users className="h-4.5 w-4.5 text-muted-foreground" />
          <h3 className="font-serif text-lg font-bold text-foreground">Referred Friends</h3>
        </div>

        {referrals.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground shadow-2xs">
            <p className="text-xs">You haven't referred any friends yet. Start sharing to earn wallet cash!</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-4">Friend Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-center">Reward</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-xs">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-neutral-50/50">
                    <td className="p-4 font-bold text-charcoal">{ref.friendName}</td>
                    <td className="p-4 text-muted-foreground font-mono">{ref.friendEmail}</td>
                    <td className="p-4 text-center font-bold text-cognac">{formatINR(ref.reward)}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                          ref.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : ref.status === "pending"
                            ? "bg-amber-500/10 text-amber-600 animate-pulse"
                            : "bg-neutral-500/10 text-neutral-600"
                        }`}
                      >
                        {ref.status === "completed" ? "Credited" : "Pending First Order"}
                      </span>
                    </td>
                    <td className="p-4 text-right text-muted-foreground">{formatDate(ref.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
