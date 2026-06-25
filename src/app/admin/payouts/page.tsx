import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { connectToDatabase } from "@/lib/db";
import Payout from "@/lib/models/Payout";
import User from "@/lib/models/User";
import VendorProfile from "@/lib/models/VendorProfile";
import PayoutsClient from "./PayoutsClient";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  await connectToDatabase();

  const payoutsRaw = await Payout.find()
    .sort({ createdAt: -1 })
    .populate({ path: "vendorId", model: User, select: "name email" })
    .lean();

  const vendorIds = payoutsRaw.map(p => p.vendorId?._id || p.vendorId).filter(Boolean);
  const profiles = await VendorProfile.find({ userId: { $in: vendorIds } })
    .select("userId bankAccount storeName")
    .lean();
  const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

  const payouts = payoutsRaw.map((p: any) => {
    const vId = p.vendorId?._id?.toString() || p.vendorId?.toString() || "";
    const profile = profileMap.get(vId);
    return {
      id: p._id.toString(),
      payoutId: p.payoutId,
      vendorId: vId,
      vendorName: p.vendorId?.name || "Unknown Seller",
      vendorEmail: p.vendorId?.email || "",
      storeName: profile?.storeName || "Withdrawal",
      amount: p.amount,
      commissionDeducted: p.commissionDeducted || 0,
      netPayout: p.netPayout,
      status: p.status,
      bankTransactionId: p.bankTransactionId || "",
      remarks: p.remarks || "",
      requestedAt: p.requestedAt?.toISOString() || p.createdAt?.toISOString() || new Date().toISOString(),
      bankAccount: profile?.bankAccount || null,
    };
  });

  return (
    <DashboardPage eyebrow="Finance" title="Payout Processing">
      <PayoutsClient initialPayouts={payouts} />
    </DashboardPage>
  );
}
