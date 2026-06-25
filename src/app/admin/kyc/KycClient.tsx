"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Check, X, Eye, FileText, Download } from "lucide-react";

interface KycDoc {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  storeName: string;
  docType: 'gstin' | 'pan' | 'bank_proof' | 'aadhaar' | 'signature';
  docNumber: string;
  fileUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason: string;
  submittedAt: string;
}

export default function KycClient({ initialDocuments }: { initialDocuments: KycDoc[] }) {
  const [documents, setDocuments] = useState<KycDoc[]>(initialDocuments);
  const [activePreview, setActivePreview] = useState<KycDoc | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleModerate = async (doc: KycDoc, action: "approve" | "reject") => {
    if (processingId) return;

    if (action === "reject" && !rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    setProcessingId(doc.id);
    try {
      const res = await fetch(`/api/admin/vendors/${doc.vendorId}/kyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: doc.docType,
          action,
          reason: action === "reject" ? rejectReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process verification request");
      }

      toast.success(`KYC document ${doc.docType.toUpperCase()} has been ${action === "approve" ? "approved" : "rejected"}!`);
      
      // Update local state status
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                status: action === "approve" ? "verified" : "rejected",
                rejectionReason: action === "reject" ? rejectReason : "",
              }
            : d
        )
      );

      // Close modals
      setRejectId(null);
      setRejectReason("");
      setActivePreview(null);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Verified</span>;
      case "rejected":
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Rejected</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Pending</span>;
    }
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "gstin": return "GSTIN Certificate";
      case "pan": return "PAN Card";
      case "bank_proof": return "Bank Proof (Cheque/Passbook)";
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold">
              <th className="px-6 py-4">Vendor / Store</th>
              <th className="px-6 py-4">Document Type</th>
              <th className="px-6 py-4">ID/Details</th>
              <th className="px-6 py-4">Submitted Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No KYC documents submitted yet.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-cream/15 transition-colors">
                  <td className="px-6 py-4.5">
                    <div>
                      <p className="font-semibold text-charcoal">{doc.storeName}</p>
                      <p className="text-xs text-muted-foreground">{doc.vendorName} ({doc.vendorEmail})</p>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 font-medium text-charcoal">
                    {getDocTypeLabel(doc.docType)}
                  </td>
                  <td className="px-6 py-4.5 text-xs text-muted-foreground max-w-xs truncate">
                    {doc.docNumber}
                  </td>
                  <td className="px-6 py-4.5 text-muted-foreground">
                    {new Date(doc.submittedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-6 py-4.5">
                    {getStatusBadge(doc.status)}
                    {doc.status === "rejected" && doc.rejectionReason && (
                      <p className="text-[10px] text-red-600 mt-1 max-w-xs italic">
                        Reason: {doc.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => setActivePreview(doc)}
                        className="p-1.5 border border-border bg-card hover:bg-muted text-charcoal rounded-lg cursor-pointer transition"
                        title="Preview Document"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {doc.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleModerate(doc, "approve")}
                            disabled={processingId === doc.id}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg cursor-pointer transition disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setRejectId(doc.id)}
                            disabled={processingId === doc.id}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg cursor-pointer transition disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lightbox / Preview Modal */}
      {activePreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-muted/20">
              <div>
                <h3 className="font-serif font-bold text-lg text-charcoal">
                  KYC Document Preview
                </h3>
                <p className="text-xs text-muted-foreground">
                  {activePreview.storeName} &mdash; {getDocTypeLabel(activePreview.docType)}
                </p>
              </div>
              <button
                onClick={() => {
                  setActivePreview(null);
                  setRejectId(null);
                }}
                className="p-1 text-muted-foreground hover:text-charcoal rounded-full hover:bg-muted cursor-pointer transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center bg-cream/10 min-h-[300px]">
              {activePreview.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                <img
                  src={activePreview.fileUrl}
                  alt={getDocTypeLabel(activePreview.docType)}
                  className="max-h-[400px] object-contain rounded-lg border border-border shadow-xs"
                />
              ) : (
                <div className="flex flex-col items-center text-center space-y-4">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <p className="text-sm font-semibold text-charcoal">PDF or Non-image Document Format</p>
                  <a
                    href={activePreview.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-charcoal text-cream px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer hover:bg-cognac"
                  >
                    <Download className="h-4 w-4" /> Download File
                  </a>
                </div>
              )}

              <div className="mt-4 p-4 border border-brass/20 bg-brass/5 rounded-xl text-xs text-cognac leading-relaxed w-full">
                <strong>Document Details:</strong> {activePreview.docNumber}
              </div>
            </div>

            {activePreview.status === "pending" && (
              <div className="border-t border-border/60 px-6 py-4 bg-muted/10 flex justify-between gap-4">
                {rejectId === activePreview.id ? (
                  <div className="flex-1 space-y-3">
                    <textarea
                      placeholder="Enter rejection reason..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full text-xs border border-border/80 rounded-xl p-3 bg-cream/30 focus:border-cognac outline-none transition"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setRejectId(null);
                          setRejectReason("");
                        }}
                        className="px-4 py-2 border border-border rounded-xl text-xs font-bold uppercase cursor-pointer hover:bg-muted"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleModerate(activePreview, "reject")}
                        disabled={processingId === activePreview.id}
                        className="px-4 py-2 bg-red-600 text-cream rounded-xl text-xs font-bold uppercase cursor-pointer hover:bg-red-700 disabled:opacity-50"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end w-full gap-2">
                    <button
                      onClick={() => setRejectId(activePreview.id)}
                      className="px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold uppercase cursor-pointer transition"
                    >
                      Reject Document
                    </button>
                    <button
                      onClick={() => handleModerate(activePreview, "approve")}
                      disabled={processingId === activePreview.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-cream rounded-xl text-xs font-bold uppercase cursor-pointer transition disabled:opacity-50"
                    >
                      Approve & Verify
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standalone Rejection Modal for Table Row Clicks */}
      {rejectId && !activePreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg text-charcoal">Reject KYC Document</h3>
            <p className="text-xs text-muted-foreground">
              Please enter the reason for rejecting this document. The vendor will receive an alert to upload it again.
            </p>
            <textarea
              placeholder="E.g., Document is blur, Details mismatches with profile, Invalid copy"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full text-xs border border-border/80 rounded-xl p-3 bg-cream/30 focus:border-cognac outline-none transition"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectId(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 border border-border rounded-xl text-xs font-bold uppercase cursor-pointer hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const doc = documents.find((d) => d.id === rejectId);
                  if (doc) handleModerate(doc, "reject");
                }}
                disabled={processingId === rejectId}
                className="px-4 py-2 bg-red-600 text-cream rounded-xl text-xs font-bold uppercase cursor-pointer hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
