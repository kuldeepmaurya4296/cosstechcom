import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { connectToDatabase } from "@/lib/db";
import KycDocument from "@/lib/models/KycDocument";
import User from "@/lib/models/User";
import VendorProfile from "@/lib/models/VendorProfile";
import KycClient from "./KycClient";

export const dynamic = "force-dynamic";

export default async function AdminKycPage() {
  await connectToDatabase();

  // Fetch all documents from KycDocument model
  const docsRaw = await KycDocument.find()
    .sort({ createdAt: -1 })
    .populate({ path: "vendorId", model: User, select: "name email" })
    .lean();

  // Fetch vendor profiles to match store names
  const vendorIds = docsRaw.map((d: any) => d.vendorId?._id || d.vendorId).filter(Boolean);
  const profiles = await VendorProfile.find({ userId: { $in: vendorIds } })
    .select("userId storeName gstNumber panNumber bankAccount")
    .lean();

  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const documents = docsRaw.map((d: any) => {
    const vId = d.vendorId?._id?.toString() || d.vendorId?.toString() || "";
    const profile = profileMap.get(vId);

    // Get the doc details from profile if possible
    let docDetail = d.docNumber || "N/A";
    if (profile) {
      if (d.docType === "gstin") docDetail = profile.gstNumber;
      else if (d.docType === "pan") docDetail = profile.panNumber;
      else if (d.docType === "bank_proof") {
        const bank = profile.bankAccount || {};
        docDetail = `${bank.holderName} - A/C: ${bank.accountNumber} - IFSC: ${bank.ifscCode}`;
      }
    }

    return {
      id: d._id.toString(),
      vendorId: vId,
      vendorName: d.vendorId?.name || "Unknown Seller",
      vendorEmail: d.vendorId?.email || "",
      storeName: profile?.storeName || "N/A",
      docType: d.docType,
      docNumber: docDetail,
      fileUrl: d.fileUrl,
      status: d.verificationStatus || "pending",
      rejectionReason: d.rejectionReason || "",
      submittedAt: d.createdAt?.toISOString() || new Date().toISOString(),
    };
  });

  return (
    <DashboardPage eyebrow="Verification" title="Vendor KYC Queue">
      <KycClient initialDocuments={documents} />
    </DashboardPage>
  );
}
