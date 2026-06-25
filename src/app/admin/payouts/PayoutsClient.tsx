"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X, FileSpreadsheet, DollarSign, RefreshCw, Landmark } from "lucide-react";
import { formatINR } from "@/lib/format";

interface PayoutRequest {
  id: string;
  payoutId: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  storeName: string;
  amount: number;
  commissionDeducted: number;
  netPayout: number;
  status: "REQUESTED" | "APPROVED" | "PROCESSING" | "COMPLETED" | "FAILED";
  bankTransactionId: string;
  remarks: string;
  requestedAt: string;
  bankAccount: {
    holderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  } | null;
}

export default function PayoutsClient({ initialPayouts }: { initialPayouts: PayoutRequest[] }) {
  const [payouts, setPayouts] = useState<PayoutRequest[]>(initialPayouts);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Modal states for finalizing payout
  const [activePayout, setActivePayout] = useState<PayoutRequest | null>(null);
  const [bankTxnId, setBankTxnId] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleUpdateStatus = async (payout: PayoutRequest, newStatus: string, txnId?: string, rem?: string) => {
    setProcessingId(payout.id);
    try {
      const res = await fetch("/api/admin/orders/payouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: payout.payoutId,
          status: newStatus,
          bankTransactionId: txnId,
          remarks: rem || `Payout marked as ${newStatus}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update payout status");
      }

      toast.success(`Payout ${payout.payoutId} updated to ${newStatus}`);
      
      // Update local state
      setPayouts(prev =>
        prev.map(p =>
          p.id === payout.id
            ? {
                ...p,
                status: newStatus as any,
                bankTransactionId: txnId || p.bankTransactionId,
                remarks: rem || p.remarks,
              }
            : p
        )
      );

      // Close modal
      setActivePayout(null);
      setBankTxnId("");
      setRemarks("");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Completed</span>;
      case "FAILED":
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Failed</span>;
      case "PROCESSING":
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Processing</span>;
      case "APPROVED":
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Approved</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Requested</span>;
    }
  };

  const downloadCSV = () => {
    // Redirect to CSV endpoint
    window.open("/api/admin/orders/payouts?format=csv", "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Showing {payouts.length} payout transactions
        </p>
        <button
          onClick={downloadCSV}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-cream px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4" /> Export Pending Refunds CSV
        </button>
      </div>

      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold">
              <th className="px-6 py-4">Payout ID</th>
              <th className="px-6 py-4">Vendor Store</th>
              <th className="px-6 py-4">Requested Amount</th>
              <th className="px-6 py-4">Bank Details</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                  No payouts registered in the ledger.
                </td>
              </tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.id} className="hover:bg-cream/15 transition-colors">
                  <td className="px-6 py-4.5 font-bold text-charcoal">
                    {p.payoutId}
                  </td>
                  <td className="px-6 py-4.5">
                    <div>
                      <p className="font-semibold text-charcoal">{p.storeName}</p>
                      <p className="text-xs text-muted-foreground">{p.vendorName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 font-bold text-charcoal">
                    {formatINR(p.netPayout)}
                  </td>
                  <td className="px-6 py-4.5 text-xs text-muted-foreground">
                    {p.bankAccount ? (
                      <div>
                        <p className="font-medium text-charcoal flex items-center gap-1">
                          <Landmark className="h-3.5 w-3.5 text-cognac" />
                          {p.bankAccount.bankName}
                        </p>
                        <p className="text-[10px]">A/C: {p.bankAccount.accountNumber}</p>
                        <p className="text-[10px]">IFSC: {p.bankAccount.ifscCode}</p>
                        <p className="text-[10px]">Name: {p.bankAccount.holderName}</p>
                      </div>
                    ) : (
                      <span className="italic text-destructive">No bank verified</span>
                    )}
                  </td>
                  <td className="px-6 py-4.5">
                    {getStatusBadge(p.status)}
                    {p.bankTransactionId && (
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] truncate">
                        TXN: {p.bankTransactionId}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4.5 text-muted-foreground">
                    {new Date(p.requestedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {p.status === "REQUESTED" && (
                        <button
                          onClick={() => handleUpdateStatus(p, "APPROVED")}
                          disabled={processingId === p.id}
                          className="bg-indigo-600 hover:bg-indigo-700 text-cream text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      {(p.status === "REQUESTED" || p.status === "APPROVED" || p.status === "PROCESSING") && (
                        <button
                          onClick={() => setActivePayout(p)}
                          disabled={processingId === p.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-cream text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition cursor-pointer"
                        >
                          Complete
                        </button>
                      )}
                      {(p.status === "REQUESTED" || p.status === "APPROVED") && (
                        <button
                          onClick={() => handleUpdateStatus(p, "FAILED", undefined, "Payout cancelled by admin.")}
                          disabled={processingId === p.id}
                          className="bg-red-500 hover:bg-red-600 text-cream text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition cursor-pointer"
                        >
                          Fail/Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Complete Payout Modal */}
      {activePayout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="font-serif font-bold text-lg text-charcoal">Complete Payout Transaction</h3>
            
            <div className="p-4 border border-brass/20 bg-brass/5 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payout to:</span>
                <span className="font-bold text-charcoal">{activePayout.storeName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Payout Amount:</span>
                <span className="font-extrabold text-cognac">{formatINR(activePayout.netPayout)}</span>
              </div>
              {activePayout.bankAccount && (
                <div className="text-xs pt-2 border-t border-border/60 text-muted-foreground space-y-1">
                  <p><strong>Bank:</strong> {activePayout.bankAccount.bankName}</p>
                  <p><strong>A/C:</strong> {activePayout.bankAccount.accountNumber}</p>
                  <p><strong>IFSC:</strong> {activePayout.bankAccount.ifscCode}</p>
                  <p><strong>Beneficiary:</strong> {activePayout.bankAccount.holderName}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Bank Transaction / UTR ID
                </label>
                <input
                  type="text"
                  placeholder="E.g., UTR12938472910"
                  value={bankTxnId}
                  onChange={(e) => setBankTxnId(e.target.value)}
                  className="w-full text-xs border border-border/80 rounded-xl p-3 bg-cream/35 focus:border-cognac outline-none transition"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Internal Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="E.g., Batch payment processed via HDFC netbanking"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs border border-border/80 rounded-xl p-3 bg-cream/35 focus:border-cognac outline-none transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setActivePayout(null);
                  setBankTxnId("");
                  setRemarks("");
                }}
                className="px-4 py-2 border border-border rounded-xl text-xs font-bold uppercase cursor-pointer hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(activePayout, "COMPLETED", bankTxnId, remarks)}
                disabled={processingId === activePayout.id || !bankTxnId.trim()}
                className="px-4 py-2 bg-emerald-600 text-cream rounded-xl text-xs font-bold uppercase cursor-pointer hover:bg-emerald-700 disabled:opacity-50"
              >
                Confirm Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
