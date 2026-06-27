import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { connectToDatabase } from "@/lib/db";
import SubOrder from "@/lib/models/SubOrder";
import User from "@/lib/models/User";
import VendorProfile from "@/lib/models/VendorProfile";
import TcsReport from "@/lib/models/TcsReport";
import Payout from "@/lib/models/Payout";
import ReconciliationClient from "./ReconciliationClient";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export default async function AdminReconciliationPage() {
  await connectToDatabase();

  // Fetch all suborders
  const subOrders = await SubOrder.find()
    .populate({ path: "vendorId", model: User, select: "name email" })
    .lean();

  let totalSales = 0;
  let totalCommission = 0;
  let totalPayouts = 0;
  let totalShipping = 0;
  let totalTax = 0;

  const vendorMetrics = new Map<string, any>();

  for (const so of subOrders) {
    const pricing = so.pricing || {};
    const subtotal = pricing.subtotal || 0;
    const commission = pricing.platformCommission || 0;
    const shipping = pricing.shippingCost || 0;
    const tax = pricing.tax || 0;
    const total = pricing.total || 0;
    const payout = pricing.vendorPayout || 0;

    totalSales += total;
    totalCommission += commission;
    totalPayouts += payout;
    totalShipping += shipping;
    totalTax += tax;

    const vId = so.vendorId?._id?.toString() || so.vendorId?.toString() || "Unknown";
    if (!vendorMetrics.has(vId)) {
      vendorMetrics.set(vId, {
        vendorId: vId,
        name: (so.vendorId as any)?.name || "Unknown Seller",
        email: (so.vendorId as any)?.email || "",
        storeName: "",
        grossSales: 0,
        commissionCollected: 0,
        payoutsGenerated: 0,
        subOrderCount: 0,
      });
    }

    const metrics = vendorMetrics.get(vId);
    metrics.grossSales += total;
    metrics.commissionCollected += commission;
    metrics.payoutsGenerated += payout;
    metrics.subOrderCount += 1;
  }

  const vendorIds = Array.from(vendorMetrics.keys()).filter((id) => id !== "Unknown" && mongoose.isValidObjectId(id));
  const profiles = await VendorProfile.find({ userId: { $in: vendorIds } }).select("userId storeName tcsRate").lean();
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  for (const [vId, metrics] of vendorMetrics.entries()) {
    const prof = profileMap.get(vId);
    if (prof) {
      metrics.storeName = prof.storeName;
      metrics.tcsRate = prof.tcsRate || 0.5;
      metrics.tcsCollected = Math.round(metrics.grossSales * (metrics.tcsRate / 100));
    } else {
      metrics.storeName = "N/A";
      metrics.tcsRate = 0.5;
      metrics.tcsCollected = Math.round(metrics.grossSales * 0.005);
    }
  }

  // Payout aggregations
  const payouts = await Payout.find().lean();
  let payoutsRequested = 0;
  let payoutsCompleted = 0;

  for (const p of payouts) {
    if (p.status === "COMPLETED") {
      payoutsCompleted += p.netPayout;
    } else if (p.status === "REQUESTED" || p.status === "PROCESSING" || p.status === "APPROVED") {
      payoutsRequested += p.netPayout;
    }
  }

  // TCS Reports
  const tcsReports = await TcsReport.find().lean();
  let totalTcsFiled = 0;
  let totalTcsPending = 0;

  for (const report of tcsReports) {
    if (report.depositStatus === "filed" || report.depositStatus === "deposited") {
      totalTcsFiled += report.tcsAmount;
    } else {
      totalTcsPending += report.tcsAmount;
    }
  }

  const summary = {
    totalSales,
    totalCommission,
    totalPayouts,
    totalShipping,
    totalTax,
    payoutsCompleted,
    payoutsRequested,
    totalTcsFiled,
    totalTcsPending,
    netFeesCollected: totalCommission - payoutsRequested - payoutsCompleted,
  };

  return (
    <DashboardPage eyebrow="Finance" title="Financial Settlements">
      <ReconciliationClient summary={summary} ledgers={Array.from(vendorMetrics.values())} />
    </DashboardPage>
  );
}
