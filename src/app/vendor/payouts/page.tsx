"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { StatCard } from "@/modules/admin/dashboard/components/StatCard";
import { IndianRupee, Wallet, Send, ArrowRight } from "lucide-react";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface Payout {
  _id: string;
  payoutId: string;
  amount: number;
  commissionDeducted: number;
  netPayout: number;
  status: "REQUESTED" | "APPROVED" | "PROCESSING" | "COMPLETED" | "FAILED";
  bankTransactionId?: string;
  remarks?: string;
  requestedAt: string;
}

export default function VendorPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Payouts list
      const payoutsRes = await fetch("/api/vendor/payouts");
      if (!payoutsRes.ok) throw new Error("Failed to fetch payouts list");
      const payoutsData = await payoutsRes.json();
      setPayouts(payoutsData);

      // 2. Fetch Wallet Balance from Profile
      const profileRes = await fetch("/api/user/profile");
      if (!profileRes.ok) throw new Error("Failed to fetch profile");
      const profileData = await profileRes.json();
      if (profileData?.success && profileData.user) {
        setWalletBalance(profileData.user.walletBalance || 0);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > walletBalance) {
      toast.error(`Insufficient balance. Max withdrawable: ${formatINR(walletBalance)}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vendor/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Withdrawal request failed");
      }

      toast.success("Payout request submitted successfully!");
      setWithdrawAmount("");
      fetchData(); // reload balance & history
    } catch (err: any) {
      toast.error(err.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Paid</span>;
      case "FAILED":
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Failed</span>;
      case "PROCESSING":
      case "APPROVED":
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">In Progress</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Requested</span>;
    }
  };

  const totalPaidYTD = payouts
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.netPayout, 0);

  const totalRequestedPending = payouts
    .filter((p) => ["REQUESTED", "APPROVED", "PROCESSING"].includes(p.status))
    .reduce((sum, p) => sum + p.netPayout, 0);

  return (
    <DashboardPage eyebrow="Finance" title="Payouts & Earnings">
      {loading ? (
        <div className="flex justify-center items-center p-12 text-muted-foreground">
          Loading payouts overview...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Withdrawable Balance (Wallet)"
              value={formatINR(walletBalance)}
              icon={Wallet}
              tint="accent"
            />
            <StatCard
              label="Paid Earnings (Completed)"
              value={formatINR(totalPaidYTD)}
              icon={IndianRupee}
              tint="brass"
            />
            <StatCard
              label="Processing Payouts"
              value={formatINR(totalRequestedPending)}
              icon={Send}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Withdrawal request form */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-xs">
              <div>
                <h3 className="font-serif font-bold text-lg text-charcoal">Request Withdrawal</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Transfer funds from your wallet directly to your registered bank account.
                </p>
              </div>

              <form onSubmit={handleWithdrawRequest} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
                    Amount to Withdraw (INR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount (e.g. 5000)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={walletBalance <= 0}
                    className="w-full text-sm border border-border/80 rounded-xl p-3 bg-cream/35 focus:border-cognac outline-none transition disabled:opacity-55"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || walletBalance <= 0 || !withdrawAmount}
                  className="w-full flex items-center justify-center gap-2 bg-charcoal text-cream hover:bg-cognac py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition disabled:opacity-55"
                >
                  {submitting ? "Submitting..." : "Send Request"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Payouts list table */}
            <div className="md:col-span-2 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold">
                    <th className="px-5 py-3">Payout ID</th>
                    <th className="px-5 py-3">Requested Date</th>
                    <th className="px-5 py-3">Net Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                        No payout history found.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p) => (
                      <tr key={p._id} className="hover:bg-cream/10 transition-colors">
                        <td className="px-5 py-4 font-bold text-charcoal">{p.payoutId}</td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {formatDate(p.requestedAt)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-charcoal">
                          {formatINR(p.netPayout)}
                        </td>
                        <td className="px-5 py-4">
                          {getStatusBadge(p.status)}
                          {p.bankTransactionId && (
                            <span className="block text-[9px] text-muted-foreground mt-0.5">
                              TXN: {p.bankTransactionId}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardPage>
  );
}
