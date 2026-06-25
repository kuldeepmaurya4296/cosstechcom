"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle, FileText, Upload } from "lucide-react";

export default function VendorKycPage() {
  const [kycData, setKycData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  
  // Document URLs
  const [gstinUrl, setGstinUrl] = useState("");
  const [panUrl, setPanUrl] = useState("");
  const [bankProofUrl, setBankProofUrl] = useState("");

  // Upload States
  const [uploadingGstin, setUploadingGstin] = useState(false);
  const [uploadingPan, setUploadingPan] = useState(false);
  const [uploadingBank, setUploadingBank] = useState(false);

  useEffect(() => {
    fetchDashboardKyc();
  }, []);

  const fetchDashboardKyc = () => {
    fetch("/api/vendor/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setKycData(data);
        if (data) {
          // Pre-populate if already exist
          setGstin(data.gstin || "");
          setPan(data.pan || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load KYC state", err);
        setLoading(false);
      });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "gstin" | "pan" | "bank"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    const setUploading = 
      type === "gstin" ? setUploadingGstin : 
      type === "pan" ? setUploadingPan : setUploadingBank;
    
    const setUrl = 
      type === "gstin" ? setGstinUrl : 
      type === "pan" ? setPanUrl : setBankProofUrl;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/upload?filename=${type}-${Date.now()}-${file.name}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setUrl(result.url);
        toast.success(`${type.toUpperCase()} document uploaded successfully!`);
      } else {
        toast.error(result.error || "File upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("File upload connection failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gstin || !pan || !holderName || !bankName || !accountNumber || !ifscCode) {
      toast.error("Please fill in all text fields");
      return;
    }

    if (!gstinUrl || !panUrl || !bankProofUrl) {
      toast.error("Please upload all three supporting document proofs");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/vendor/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gstin,
          pan,
          bankAccount: {
            holderName,
            bankName,
            accountNumber,
            ifscCode,
          },
          documents: {
            gstinUrl,
            panUrl,
            bankProofUrl,
          },
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(result.message);
        fetchDashboardKyc();
      } else {
        toast.error(result.error || "KYC submission failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("KYC submission connection failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardPage eyebrow="Seller Portal" title="KYC Verification">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardPage>
    );
  }

  const {
    kycStatus = "pending",
    gstinVerified = false,
    panVerified = false,
    bankVerified = false,
  } = kycData || {};

  return (
    <DashboardPage eyebrow="Seller Portal" title="KYC Verification">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form / Status Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Alert Banner */}
          {kycStatus === "verified" ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl p-5 flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 mt-0.5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="font-serif font-bold text-sm">KYC Verification Completed</h4>
                <p className="text-xs text-emerald-600/80 mt-1">
                  Your merchant business identity has been verified. You have full listing and payouts access.
                </p>
              </div>
            </div>
          ) : kycStatus === "submitted" ? (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl p-5 flex items-start gap-4">
              <Clock className="h-6 w-6 mt-0.5 text-amber-500 shrink-0" />
              <div>
                <h4 className="font-serif font-bold text-sm">Verification Under Review</h4>
                <p className="text-xs text-amber-600/80 mt-1">
                  Your KYC documents are currently being checked. We will verify your accounts within 24 hours.
                </p>
              </div>
            </div>
          ) : kycStatus === "rejected" ? (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-5 flex items-start gap-4">
              <ShieldAlert className="h-6 w-6 mt-0.5 text-rose-500 shrink-0" />
              <div>
                <h4 className="font-serif font-bold text-sm">KYC Verification Failed</h4>
                <p className="text-xs text-rose-600/80 mt-1">
                  One or more submitted documents failed automatic check or were rejected by the admin. Please verify your details and resubmit.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-xl p-5 flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 mt-0.5 text-blue-500 shrink-0" />
              <div>
                <h4 className="font-serif font-bold text-sm">KYC Actions Required</h4>
                <p className="text-xs text-blue-600/80 mt-1">
                  Indian e-commerce regulations require GSTIN, PAN, and Bank verification before activating vendor listings.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold mb-4">Onboarding Verification Details</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GSTIN */}
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    GSTIN Number
                    {gstinVerified && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">Verified</span>}
                  </span>
                  <input
                    type="text"
                    disabled={kycStatus === "verified" || kycStatus === "submitted"}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="15-digit GSTIN (e.g. 08AAAAA1111A1Z0)"
                    maxLength={15}
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm uppercase disabled:opacity-50"
                    required
                  />
                </label>

                {/* PAN */}
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    Business / Personal PAN
                    {panVerified && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">Verified</span>}
                  </span>
                  <input
                    type="text"
                    disabled={kycStatus === "verified" || kycStatus === "submitted"}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="10-digit PAN (e.g. ABCDE1234F)"
                    maxLength={10}
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm uppercase disabled:opacity-50"
                    required
                  />
                </label>
              </div>

              <div className="border-t border-border/60 my-6" />

              <h4 className="font-serif text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                Settlement Bank Account Details
                {bankVerified && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">Verified</span>}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Name */}
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Account Holder Name
                  </span>
                  <input
                    type="text"
                    disabled={kycStatus === "verified" || kycStatus === "submitted"}
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="Exactly as registered in Bank Book"
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm disabled:opacity-50"
                    required
                  />
                </label>

                {/* Bank Name */}
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bank Name
                  </span>
                  <input
                    type="text"
                    disabled={kycStatus === "verified" || kycStatus === "submitted"}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, SBI"
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm disabled:opacity-50"
                    required
                  />
                </label>

                {/* Account Number */}
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Account Number
                  </span>
                  <input
                    type="text"
                    disabled={kycStatus === "verified" || kycStatus === "submitted"}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Bank Account Number"
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm disabled:opacity-50"
                    required
                  />
                </label>

                {/* IFSC Code */}
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bank IFSC Code
                  </span>
                  <input
                    type="text"
                    disabled={kycStatus === "verified" || kycStatus === "submitted"}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="11-digit IFSC code (e.g. HDFC0000123)"
                    maxLength={11}
                    className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm uppercase disabled:opacity-50"
                    required
                  />
                </label>
              </div>

              {/* Document Uploads */}
              {kycStatus !== "verified" && kycStatus !== "submitted" && (
                <>
                  <div className="border-t border-border/60 my-6" />
                  <h4 className="font-serif text-sm font-bold text-muted-foreground">Upload Document Proofs (JPEG, PNG, WEBP, PDF)</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* GSTIN Upload */}
                    <div className="border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 bg-muted/20">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs font-bold">GSTIN Certificate</span>
                      <p className="text-[10px] text-muted-foreground">Principal place address certificate</p>
                      
                      {gstinUrl ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Ready</span>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 bg-charcoal text-cream hover:bg-cognac px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition">
                          <Upload className="h-3 w-3" />
                          {uploadingGstin ? "Uploading..." : "Upload File"}
                          <input type="file" onChange={(e) => handleFileUpload(e, "gstin")} className="hidden" accept="image/*,application/pdf" />
                        </label>
                      )}
                    </div>

                    {/* PAN Upload */}
                    <div className="border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 bg-muted/20">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs font-bold">PAN Card Copy</span>
                      <p className="text-[10px] text-muted-foreground">Business or Individual PAN copy</p>
                      
                      {panUrl ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Ready</span>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 bg-charcoal text-cream hover:bg-cognac px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition">
                          <Upload className="h-3 w-3" />
                          {uploadingPan ? "Uploading..." : "Upload File"}
                          <input type="file" onChange={(e) => handleFileUpload(e, "pan")} className="hidden" accept="image/*,application/pdf" />
                        </label>
                      )}
                    </div>

                    {/* Bank Proof Upload */}
                    <div className="border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 bg-muted/20">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs font-bold">Bank Verification</span>
                      <p className="text-[10px] text-muted-foreground">Cancelled Cheque or passbook page</p>
                      
                      {bankProofUrl ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Ready</span>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 bg-charcoal text-cream hover:bg-cognac px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition">
                          <Upload className="h-3 w-3" />
                          {uploadingBank ? "Uploading..." : "Upload File"}
                          <input type="file" onChange={(e) => handleFileUpload(e, "bank")} className="hidden" accept="image/*,application/pdf" />
                        </label>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Submit Buttons */}
              {kycStatus !== "verified" && kycStatus !== "submitted" && (
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-accent text-accent-foreground disabled:opacity-50 px-8 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all duration-300 hover:scale-102 cursor-pointer shadow-md"
                  >
                    {submitting ? "Verifying Details..." : "Submit KYC and Verify"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Information Checklist */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="font-serif font-bold text-sm text-foreground">Why is KYC required?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Under India's **Consumer Protection (E-Commerce) Rules, 2020** and the **GST Act (Section 52)**, marketplace platforms must maintain verified records of selling merchants.
            </p>
            <ul className="text-xs text-muted-foreground space-y-2.5 pl-4 list-disc">
              <li><strong>GSTIN:</strong> Confirms correct state tax collection (CGST, SGST, IGST) splits per order.</li>
              <li><strong>TCS Compliance:</strong> Ensures 0.5% tax collected at source is credited to the correct GSTIN.</li>
              <li><strong>Penny Drop Check:</strong> Instant ₹1 bank transfer verifies account details to avoid payout transaction failures.</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
}
