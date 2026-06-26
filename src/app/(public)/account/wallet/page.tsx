"use client";

import { useEffect, useState } from "react";
import { Wallet, History, CreditCard, Sparkles, ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface WalletTxn {
  id: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  description: string;
  referenceType: string;
  referenceId: string | null;
  status: string;
  createdAt: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<WalletTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchWalletDetails = async () => {
    try {
      const res = await fetch("/api/user/wallet");
      if (!res.ok) throw new Error("Failed to load wallet details");
      const data = await res.json();
      setBalance(data.balance || 0);
      setHistory(data.history || []);
    } catch (err: any) {
      console.error("Wallet loading error:", err);
      setError("Could not retrieve wallet balance details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(addAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Please enter a valid positive amount.");
      return;
    }

    setAdding(true);
    try {
      // Call mock api to add money. Since we don't have a direct top-up endpoint,
      // we can make a POST request to profile or a mock wallet API.
      // Wait, let's look at how we can implement a mock add money.
      // Let's check if we should add a POST method to /api/user/wallet to simulate adding money to user wallet!
      // Yes! Let's implement POST in `/api/user/wallet/route.ts` to allow simulating adding money.
      const res = await fetch("/api/user/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountVal }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add money");
      }

      toast.success(`Successfully added ${formatINR(amountVal)} to your wallet!`);
      setAddAmount("");
      setShowModal(false);
      fetchWalletDetails();
    } catch (err: any) {
      toast.error(err.message || "Failed to simulate top-up");
    } finally {
      setAdding(false);
    }
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">My Wallet</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your digital wallet balance, view transactions ledger, and use for quick checkouts.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition shadow"
        >
          Add Money
        </button>
      </div>

      {/* Hero Card / Wallet Balance */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 to-blue-900 text-cream p-6 md:p-8 shadow-lg border border-indigo-600/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_-20%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200/90 block">
              Wallet Balance
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-4xl md:text-5xl font-black tracking-tight">
                {formatINR(balance ?? 0)}
              </span>
            </div>
            <p className="text-xs text-indigo-100/80 font-medium">
              Use this balance at checkout to deduct from order totals instantly.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4.5 py-3.5 rounded-xl border border-white/10 shrink-0 self-start sm:self-auto">
            <Wallet className="h-6 w-6 text-indigo-200" />
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-200 block">
                Payment Type
              </span>
              <span className="text-[11px] text-cream font-bold block">1-Click Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Point Rules Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border/80 rounded-xl p-5 flex items-start gap-4 shadow-2xs">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700 shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-charcoal">
              Instant Refunds
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Disputes and returns can be refunded instantly to your wallet for immediate reuse.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-5 flex items-start gap-4 shadow-2xs">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-charcoal">
              Double-Entry Security
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Every wallet credit and debit transaction is tracked with cryptographic ledgers.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-border/40">
          <History className="h-4.5 w-4.5 text-muted-foreground" />
          <h3 className="font-serif text-lg font-bold text-foreground">Transaction Ledgers</h3>
        </div>

        {history.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground shadow-2xs">
            <Info className="h-7 w-7 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm font-semibold">No transactions recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Top up your wallet or receive refunds to see ledger transactions here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((log) => {
              const isCredit = log.type === "credit";
              const amountDisplay = isCredit ? `+${formatINR(log.amount)}` : `-${formatINR(log.amount)}`;

              return (
                <div
                  key={log.id}
                  className="bg-card border border-border hover:border-indigo-500/20 rounded-xl p-4.5 flex items-center justify-between gap-4 transition-all shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isCredit ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                      }`}>
                        {isCredit ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {log.type}
                      </span>
                      {log.referenceId && (
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-semibold font-mono">
                          REF: {log.referenceType.toUpperCase()} ({log.referenceId.slice(-6)})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-normal">
                      {log.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/75 mt-1 font-medium">
                      {formatDate(log.createdAt)} | Balance: {formatINR(log.balanceAfter)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`font-serif text-base font-bold ${
                        isCredit ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {amountDisplay}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-elevated animate-in zoom-in-95 duration-200">
            <h3 className="font-serif text-lg font-bold text-foreground">Add Money to Wallet</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Simulate adding digital cash balance directly into your platform wallet.
            </p>

            <form onSubmit={handleAddMoney} className="mt-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1.5">
                  Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-serif text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Enter amount (e.g. 1000)..."
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer transition disabled:opacity-50"
                >
                  {adding ? "Adding..." : "Add Balance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
