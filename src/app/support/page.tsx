"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { StatCard } from "@/modules/admin/dashboard/components/StatCard";
import { MessageSquare, AlertTriangle, ShieldCheck, User, Store, Send, CheckCircle, RefreshCcw, AlertCircle } from "lucide-react";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface Message {
  sender: "customer" | "vendor" | "support" | "admin";
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface Dispute {
  _id: string;
  disputeId: string;
  orderId: string;
  orderSeqId: string;
  subOrderId?: string;
  subOrderSeqId?: string;
  customerId: {
    _id: string;
    name: string;
    email: string;
  };
  vendorId?: {
    _id: string;
    name: string;
    email: string;
  };
  type: "WRONG_ITEM" | "DAMAGED" | "NOT_DELIVERED" | "QUALITY" | "OTHER";
  description: string;
  evidenceImages: string[];
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
  assignedTo?: string;
  resolution?: {
    action: "REFUND_WALLET" | "REFUND_GATEWAY" | "REPLACEMENT" | "REJECTED" | "OTHER";
    refundAmount?: number;
    walletCredit?: number;
    vendorPenalty?: number;
    resolvedAt?: string;
    resolvedBy?: string;
  };
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function SupportMediationPage() {
  const [assignedCases, setAssignedCases] = useState<Dispute[]>([]);
  const [unclaimedCases, setUnclaimedCases] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "unclaimed" | "resolved">("active");
  const [selectedCase, setSelectedCase] = useState<Dispute | null>(null);
  
  const selectedCaseIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedCaseIdRef.current = selectedCase?._id || null;
  }, [selectedCase]);

  // Form states for chat & resolution
  const [chatMessage, setChatMessage] = useState("");
  const [resAction, setResAction] = useState<"REFUND_WALLET" | "REFUND_GATEWAY" | "REJECTED">("REFUND_WALLET");
  const [refundAmt, setRefundAmt] = useState("");
  const [penaltyAmt, setPenaltyAmt] = useState("");
  const [resNote, setResNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/support");
      if (!res.ok) throw new Error("Failed to fetch dispute cases from server.");
      const data = await res.json();
      setAssignedCases(data.assigned || []);
      setUnclaimedCases(data.unclaimed || []);

      // Refresh currently selected case data if open (using Ref to prevent stale closure)
      const currentSelectedId = selectedCaseIdRef.current;
      if (currentSelectedId) {
        const all = [...(data.assigned || []), ...(data.unclaimed || [])];
        const updated = all.find((c) => c._id === currentSelectedId);
        if (updated) setSelectedCase(updated);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load dispute cases.");
      toast.error("Failed to load dispute cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleClaim = async (caseId: string) => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: caseId, action: "claim" }),
      });

      if (!res.ok) throw new Error("Claim failed");
      toast.success("Dispute case claimed successfully!");
      await fetchCases();
    } catch (err: any) {
      toast.error(err.message || "Failed to claim case.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !chatMessage.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCase._id,
          action: "add_message",
          message: chatMessage,
        }),
      });

      if (!res.ok) throw new Error("Message send failed");
      setChatMessage("");
      await fetchCases();
    } catch (err: any) {
      toast.error(err.message || "Could not send message.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCase._id,
          action: "resolve",
          resolutionAction: resAction,
          refundAmount: Number(refundAmt) || 0,
          vendorPenalty: Number(penaltyAmt) || 0,
          note: resNote,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Resolution failed");
      }

      toast.success("Dispute case resolved successfully!");
      setRefundAmt("");
      setPenaltyAmt("");
      setResNote("");
      setSelectedCase(null);
      await fetchCases();
    } catch (err: any) {
      toast.error(err.message || "Could not resolve dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardPage eyebrow="Customer Care" title="Mediation Center">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardPage>
    );
  }

  if (error) {
    return (
      <DashboardPage eyebrow="Customer Care" title="Mediation Center">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center max-w-lg mx-auto mt-12">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-foreground mb-1">Failed to Load Disputes</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchCases}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer transition shadow"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </DashboardPage>
    );
  }

  const activeCases = assignedCases.filter((c) => c.status === "INVESTIGATING");
  const resolvedCases = assignedCases.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED");

  return (
    <DashboardPage eyebrow="Mediation Center" title="Disputes & Arbitration">
      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Active Cases" value={activeCases.length.toString()} icon={MessageSquare} tint="primary" />
        <StatCard label="Unclaimed Tickets" value={unclaimedCases.length.toString()} icon={AlertTriangle} tint="accent" />
        <StatCard label="Resolved Tickets" value={resolvedCases.length.toString()} icon={ShieldCheck} tint="brass" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Cases List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex border-b border-border gap-4">
            <button
              onClick={() => {
                setActiveTab("active");
                setSelectedCase(null);
              }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative transition cursor-pointer ${
                activeTab === "active" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Cases ({activeCases.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("unclaimed");
                setSelectedCase(null);
              }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative transition cursor-pointer ${
                activeTab === "unclaimed" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Queue ({unclaimedCases.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("resolved");
                setSelectedCase(null);
              }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative transition cursor-pointer ${
                activeTab === "resolved" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Resolved ({resolvedCases.length})
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {activeTab === "active" && (
              <>
                {activeCases.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 bg-card border border-dashed border-border rounded-xl">
                    No active cases assigned. Select a ticket from the queue.
                  </p>
                ) : (
                  activeCases.map((c) => (
                    <DisputeRow
                      key={c._id}
                      dispute={c}
                      selected={selectedCase?._id === c._id}
                      onClick={() => setSelectedCase(c)}
                    />
                  ))
                )}
              </>
            )}

            {activeTab === "unclaimed" && (
              <>
                {unclaimedCases.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 bg-card border border-dashed border-border rounded-xl">
                    No pending tickets in queue. Nice work!
                  </p>
                ) : (
                  unclaimedCases.map((c) => (
                    <DisputeRow
                      key={c._id}
                      dispute={c}
                      selected={selectedCase?._id === c._id}
                      onClick={() => setSelectedCase(c)}
                    />
                  ))
                )}
              </>
            )}

            {activeTab === "resolved" && (
              <>
                {resolvedCases.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 bg-card border border-dashed border-border rounded-xl">
                    No resolved disputes history found.
                  </p>
                ) : (
                  resolvedCases.map((c) => (
                    <DisputeRow
                      key={c._id}
                      dispute={c}
                      selected={selectedCase?._id === c._id}
                      onClick={() => setSelectedCase(c)}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Side: Mediation Panel Workspace */}
        <div className="lg:col-span-7 bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm min-h-[500px] flex flex-col">
          {selectedCase ? (
            <div className="flex-1 flex flex-col h-full space-y-6">
              {/* Header Details */}
              <div className="flex justify-between items-start border-b border-border/50 pb-4 gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-foreground">
                      {selectedCase.disputeId}
                    </span>
                    <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {selectedCase.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
                    ORDER REF: {selectedCase.orderSeqId}
                    {selectedCase.subOrderSeqId ? ` | SUB-ORDER: ${selectedCase.subOrderSeqId}` : ""}
                  </p>
                </div>
                {selectedCase.status === "OPEN" && (
                  <button
                    onClick={() => handleClaim(selectedCase._id)}
                    disabled={submitting}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer shadow"
                  >
                    Claim Ticket
                  </button>
                )}
                {selectedCase.status === "RESOLVED" && (
                  <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
                    <ShieldCheck className="h-4 w-4" />
                    <span>RESOLVED</span>
                  </div>
                )}
              </div>

              {/* Dispute Description & Contact details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/40 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold block">
                    Complainant Details
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{selectedCase.customerId?.name}</span>
                  </div>
                  <p className="text-muted-foreground">{selectedCase.customerId?.email}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold block">
                    Vendor Partner
                  </span>
                  {selectedCase.vendorId ? (
                    <>
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <Store className="h-3.5 w-3.5" />
                        <span>{selectedCase.vendorId?.name}</span>
                      </div>
                      <p className="text-muted-foreground">{selectedCase.vendorId?.email}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Direct/Platform Order</p>
                  )}
                </div>

                <div className="sm:col-span-2 border-t border-border/40 pt-2 space-y-1">
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold block">
                    Dispute Reason & Details
                  </span>
                  <p className="text-foreground leading-relaxed italic">
                    "{selectedCase.description}"
                  </p>
                  {selectedCase.evidenceImages?.length > 0 && (
                    <div className="flex gap-2 flex-wrap pt-2">
                      {selectedCase.evidenceImages.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                          <img
                            src={img}
                            alt="evidence"
                            className="h-14 w-14 object-cover border border-border rounded-lg hover:opacity-85 transition"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 flex flex-col justify-between border border-border/60 rounded-xl p-4 bg-muted/10 h-72">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin max-h-56">
                  {selectedCase.messages?.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-10">
                      No messages logged. Mediation started.
                    </p>
                  ) : (
                    selectedCase.messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs ${
                          m.sender === "support"
                            ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                            : m.sender === "customer"
                            ? "bg-muted border border-border text-foreground mr-auto rounded-tl-none"
                            : "bg-amber-500/10 border border-amber-500/20 text-amber-900 mr-auto rounded-tl-none"
                        }`}
                      >
                        <div className="flex justify-between items-center gap-2 mb-1.5 opacity-80 font-bold text-[9px] uppercase tracking-wider">
                          <span>
                            {m.senderName} ({m.sender})
                          </span>
                          <span>{formatDate(m.timestamp)}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {selectedCase.status === "INVESTIGATING" && (
                  <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-border pt-3 mt-2">
                    <input
                      type="text"
                      placeholder="Type a mediation message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-primary text-primary-foreground hover:bg-primary/95 p-2 rounded-xl transition cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>

              {/* Settlement Actions Panel */}
              {selectedCase.status === "INVESTIGATING" && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-serif font-bold text-sm mb-3 text-foreground flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Resolution Settlement Portal</span>
                  </h4>
                  <form onSubmit={handleResolve} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Settlement Action
                        </label>
                        <select
                          value={resAction}
                          onChange={(e) => setResAction(e.target.value as any)}
                          className="w-full bg-card border border-border rounded-lg p-2 focus:ring-1 focus:ring-primary"
                        >
                          <option value="REFUND_WALLET">Refund Customer Wallet</option>
                          <option value="REFUND_GATEWAY">Refund PG/Cashback</option>
                          <option value="REJECTED">Reject/Dismiss Claim</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Refund Amount (INR)
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={refundAmt}
                          onChange={(e) => setRefundAmt(e.target.value)}
                          className="w-full bg-card border border-border rounded-lg p-2 focus:ring-1 focus:ring-primary"
                          disabled={resAction === "REJECTED"}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Vendor Penalty (INR)
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={penaltyAmt}
                          onChange={(e) => setPenaltyAmt(e.target.value)}
                          className="w-full bg-card border border-border rounded-lg p-2 focus:ring-1 focus:ring-primary"
                          disabled={!selectedCase.vendorId || resAction === "REJECTED"}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        Arbitration Resolution Notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Log arbitration reasoning, refunds details, and settlement reasons..."
                        value={resNote}
                        onChange={(e) => setResNote(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg p-2 focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded-xl shadow cursor-pointer transition disabled:opacity-55"
                      >
                        Resolve Dispute
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {selectedCase.status === "RESOLVED" && (
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-xs space-y-2">
                  <h4 className="font-bold text-emerald-800">Resolution Conclusion:</h4>
                  <p className="text-muted-foreground">
                    Action Taken:{" "}
                    <strong className="text-emerald-700">{selectedCase.resolution?.action}</strong>
                  </p>
                  <p className="text-muted-foreground">
                    Customer Refunded Wallet:{" "}
                    <strong className="text-emerald-700">
                      {formatINR(selectedCase.resolution?.refundAmount || 0)}
                    </strong>
                  </p>
                  {selectedCase.resolution?.vendorPenalty != null && (
                    <p className="text-muted-foreground">
                      Vendor Penalty Deducted:{" "}
                      <strong className="text-red-700">
                        {formatINR(selectedCase.resolution.vendorPenalty)}
                      </strong>
                    </p>
                  )}
                  <p className="text-muted-foreground text-[10px]">
                    Resolved on {formatDate(selectedCase.resolution?.resolvedAt || "")}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 opacity-35 mb-2.5 text-muted-foreground" />
              <h4 className="font-serif font-bold text-base text-foreground mb-1">
                Dispute Case Mediation Workspace
              </h4>
              <p className="text-xs max-w-sm">
                Select an arbitration ticket from the list or queue to inspect logs, mediate between customer and vendor, and issue resolution refunds.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardPage>
  );
}

function DisputeRow({
  dispute,
  selected,
  onClick,
}: {
  dispute: Dispute;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`border rounded-xl p-4 cursor-pointer transition duration-150 text-xs text-left ${
        selected
          ? "bg-primary/5 border-primary shadow-sm"
          : "bg-card border-border/80 hover:bg-muted/40 hover:border-border"
      }`}
    >
      <div className="flex justify-between items-start gap-2 mb-1.5 flex-wrap">
        <span className="font-mono font-bold text-foreground">{dispute.disputeId}</span>
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
            dispute.status === "RESOLVED"
              ? "bg-emerald-500/10 text-emerald-600"
              : dispute.status === "INVESTIGATING"
              ? "bg-amber-500/10 text-amber-600"
              : "bg-blue-500/10 text-blue-600"
          }`}
        >
          {dispute.status}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">
        Type: {dispute.type.replace(/_/g, " ")}
      </p>
      <p className="text-muted-foreground line-clamp-2 italic mb-2">"{dispute.description}"</p>
      <div className="flex justify-between items-center text-[10px] text-muted-foreground border-t border-border/40 pt-2 mt-2">
        <span>From: {dispute.customerId?.name}</span>
        <span>{formatDate(dispute.createdAt)}</span>
      </div>
    </div>
  );
}
