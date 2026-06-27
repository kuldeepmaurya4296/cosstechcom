"use client";

import React, { useState, useEffect } from "react";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
  DollarSign,
  Send,
  Eye,
  Loader2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR, formatDate } from "@/lib/format";

interface DisputeMessage {
  sender: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface Dispute {
  _id: string;
  disputeId: string;
  orderId: string;
  orderSeqId: string;
  subOrderSeqId: string;
  customerId: {
    _id: string;
    name: string;
    email: string;
  } | null;
  vendorId: {
    _id: string;
    name: string;
    storeName?: string;
  } | null;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  } | null;
  type: string;
  description: string;
  evidenceImages: string[];
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
  resolution?: {
    action: string;
    refundAmount?: number;
    walletCredit?: number;
    vendorPenalty?: number;
    remarks?: string;
    resolvedAt?: string;
  };
  messages: DisputeMessage[];
  createdAt: string;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Resolution fields
  const [resAction, setResAction] = useState("REFUND_WALLET");
  const [walletCredit, setWalletCredit] = useState("0");
  const [vendorPenalty, setVendorPenalty] = useState("0");
  const [resRemarks, setResRemarks] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchDisputes = async () => {
    try {
      const res = await fetch("/api/admin/disputes");
      if (!res.ok) throw new Error("Failed to load disputes");
      const data = await res.json();
      setDisputes(data);
      if (selectedDispute) {
        const updated = data.find((d: Dispute) => d.disputeId === selectedDispute.disputeId);
        if (updated) setSelectedDispute(updated);
      }
    } catch (err: any) {
      toast.error("Failed to load dispute queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleClaimDispute = async (disputeId: string) => {
    try {
      // For simplicity, we can fetch profile/current admin ID or assign it.
      // We will POST/PUT to disputes API with action: "assign"
      const res = await fetch("/api/admin/disputes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId,
          action: "assign",
          agentId: "654321098765432109876543", // Mock Admin ID or fallback
        }),
      });

      if (!res.ok) throw new Error("Failed to claim dispute");
      toast.success("Dispute claimed. Status: INVESTIGATING.");
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || "Claim failed.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute || !chatMessage.trim()) return;

    setSendingMsg(true);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId: selectedDispute.disputeId,
          action: "message",
          message: chatMessage.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      setChatMessage("");
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || "Could not post message.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setResolving(true);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId: selectedDispute.disputeId,
          action: "resolve",
          resolution: {
            action: resAction,
            walletCredit: parseFloat(walletCredit) || 0,
            vendorPenalty: parseFloat(vendorPenalty) || 0,
            remarks: resRemarks.trim(),
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to resolve");
      }

      toast.success("Dispute resolved successfully!");
      setResRemarks("");
      setWalletCredit("0");
      setVendorPenalty("0");
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || "Could not resolve dispute.");
    } finally {
      setResolving(false);
    }
  };

  return (
    <DashboardPage eyebrow="Support" title="Customer Disputes & Complaints">
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
          {/* Dispute List Queue */}
          <div className="space-y-4">
            <h3 className="font-serif text-base font-bold text-foreground">Active Case Queue</h3>
            {disputes.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                No active disputes filed.
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((d) => (
                  <div
                    key={d._id}
                    className={`bg-card border rounded-xl p-5 hover:shadow-xs transition duration-150 cursor-pointer ${
                      selectedDispute?.disputeId === d.disputeId ? "border-primary ring-1 ring-primary/20" : "border-border"
                    }`}
                    onClick={() => setSelectedDispute(d)}
                  >
                    <div className="flex justify-between items-center border-b border-border/40 pb-3 mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-charcoal">{d.disputeId}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          d.status === "RESOLVED"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : d.status === "INVESTIGATING"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {d.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatDate(d.createdAt)}</span>
                    </div>

                    <p className="text-xs text-charcoal font-semibold">Type: {d.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                      "{d.description}"
                    </p>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/40 text-[10px] text-muted-foreground">
                      <span>Customer: <strong>{d.customerId?.name || "Customer"}</strong></span>
                      <span>Seller: <strong>{d.vendorId?.storeName || "Vendor"}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details / Mediation Chat Panel */}
          <div>
            {selectedDispute ? (
              <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-serif text-base font-bold text-charcoal">Case mediation</h3>
                    <span className="font-mono text-xs font-bold text-muted-foreground">{selectedDispute.disputeId}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Order Ref: <strong>{selectedDispute.orderSeqId}</strong> | Package: <strong>{selectedDispute.subOrderSeqId}</strong>
                  </p>
                </div>

                {/* Evidence attachments */}
                {selectedDispute.evidenceImages?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">Evidence</span>
                    <div className="flex gap-2 flex-wrap">
                      {selectedDispute.evidenceImages.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" className="relative group">
                          <img src={img} className="h-14 w-14 object-cover rounded-lg border border-border hover:opacity-95" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status operations */}
                {selectedDispute.status === "OPEN" && (
                  <button
                    onClick={() => handleClaimDispute(selectedDispute.disputeId)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl cursor-pointer transition shadow"
                  >
                    Claim Case for Investigation
                  </button>
                )}

                {/* Mediation Messages Chat */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Communication Log</span>
                  <div className="border border-border/80 rounded-xl bg-muted/20 p-3 max-h-60 overflow-y-auto space-y-3 scrollbar-thin">
                    {selectedDispute.messages.map((msg, i) => (
                      <div key={i} className="text-xs space-y-0.5">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                          <span className="capitalize">{msg.senderName} ({msg.sender})</span>
                          <span>{formatDate(msg.timestamp)}</span>
                        </div>
                        <p className="bg-card border border-border/40 p-2.5 rounded-lg leading-relaxed text-charcoal">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                  </div>

                  {selectedDispute.status !== "RESOLVED" && selectedDispute.status !== "CLOSED" && (
                    <form onSubmit={handleSendMessage} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Type a mediation message..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="flex-1 bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        disabled={sendingMsg || !chatMessage.trim()}
                        className="bg-charcoal text-cream text-xs font-bold uppercase p-2.5 rounded-xl cursor-pointer hover:bg-cognac transition disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  )}
                </div>

                {/* Resolution panel */}
                {selectedDispute.status !== "RESOLVED" && selectedDispute.status !== "CLOSED" ? (
                  <div className="border-t border-border/50 pt-5 space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">Close and Resolve Case</span>
                    <form onSubmit={handleResolveDispute} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Resolution Action</label>
                        <select
                          value={resAction}
                          onChange={(e) => setResAction(e.target.value)}
                          className="w-full bg-muted/40 border border-border rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                        >
                          <option value="REFUND_WALLET">Refund Customer Wallet (Ledger)</option>
                          <option value="REFUND_GATEWAY">Refund Razorpay (Mock Gateway)</option>
                          <option value="REJECTED">Reject Dispute (No Refund)</option>
                        </select>
                      </div>

                      {resAction === "REFUND_WALLET" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Wallet Credit (Customer)</label>
                            <input
                              type="number"
                              value={walletCredit}
                              onChange={(e) => setWalletCredit(e.target.value)}
                              className="w-full bg-muted/40 border border-border rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Penalty Debit (Vendor)</label>
                            <input
                              type="number"
                              value={vendorPenalty}
                              onChange={(e) => setVendorPenalty(e.target.value)}
                              className="w-full bg-muted/40 border border-border rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Resolution Remarks</label>
                        <textarea
                          required
                          rows={3}
                          value={resRemarks}
                          onChange={(e) => setResRemarks(e.target.value)}
                          className="w-full bg-muted/40 border border-border rounded-xl px-2.5 py-2 text-xs focus:outline-none resize-none leading-relaxed"
                          placeholder="Provide the official mediation conclusion..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={resolving}
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl cursor-pointer transition shadow"
                      >
                        {resolving ? "Resolving..." : "Submit Conclusion"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="border-t border-border/50 pt-5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4.5 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" /> Case Concluded
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Action: <strong>{selectedDispute.resolution?.action}</strong>
                    </p>
                    {selectedDispute.resolution?.walletCredit ? (
                      <p className="text-xs text-muted-foreground">
                        Customer Wallet Credit: <strong>{formatINR(selectedDispute.resolution.walletCredit)}</strong>
                      </p>
                    ) : null}
                    {selectedDispute.resolution?.remarks ? (
                      <p className="text-xs text-muted-foreground italic mt-2 bg-white/70 border border-border/40 p-2.5 rounded-lg">
                        Remarks: "{selectedDispute.resolution.remarks}"
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card border border-border border-dashed rounded-2xl p-8 text-center text-muted-foreground">
                Select a case from the queue list to begin arbitration.
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardPage>
  );
}
