import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import SubOrder from "@/lib/models/SubOrder";
import User from "@/lib/models/User";
import VendorProfile from "@/lib/models/VendorProfile";
import TcsReport from "@/lib/models/TcsReport";
import Payout from "@/lib/models/Payout";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    
    await connectToDatabase();

    // 1. Build date filter
    const dateFilter: any = {};
    if (startDateStr || endDateStr) {
      dateFilter.createdAt = {};
      if (startDateStr) dateFilter.createdAt.$gte = new Date(startDateStr);
      if (endDateStr) dateFilter.createdAt.$lte = new Date(endDateStr);
    }

    // 2. Fetch all sub-orders matching the date filter
    const subOrders = await SubOrder.find(dateFilter)
      .populate({ path: "vendorId", model: User, select: "name email" })
      .lean();

    // 3. Aggregate totals
    let totalSales = 0;
    let totalCommission = 0;
    let totalPayouts = 0;
    let totalShipping = 0;
    let totalTax = 0;

    // Group by vendor for ledger
    const vendorMetrics = new Map<string, any>();

    for (const so of subOrders) {
      const pricing = so.pricing || {};
      const subtotal = pricing.subtotal || 0;
      const commission = pricing.platformCommission || 0;
      const shipping = pricing.shippingCost || 0;
      const tax = pricing.tax || 0;
      const discount = (pricing.couponDiscount || 0) + (pricing.pointsDiscount || 0);
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

    // Fetch store names
    const vendorIds = Array.from(vendorMetrics.keys()).filter((id) => id !== "Unknown" && mongoose.isValidObjectId(id));
    const profiles = await VendorProfile.find({ userId: { $in: vendorIds } }).select("userId storeName tcsRate").lean();
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    for (const [vId, metrics] of vendorMetrics.entries()) {
      const prof = profileMap.get(vId);
      if (prof) {
        metrics.storeName = prof.storeName;
        // Estimate TCS collected
        metrics.tcsRate = prof.tcsRate || 0.5;
        metrics.tcsCollected = Math.round(metrics.grossSales * (metrics.tcsRate / 100));
      } else {
        metrics.storeName = "N/A";
        metrics.tcsRate = 0.5;
        metrics.tcsCollected = Math.round(metrics.grossSales * 0.005);
      }
    }

    // Fetch actual Payout summaries
    const payouts = await Payout.find({
      createdAt: dateFilter.createdAt || { $exists: true }
    }).lean();

    let payoutsRequested = 0;
    let payoutsCompleted = 0;

    for (const p of payouts) {
      if (p.status === "COMPLETED") {
        payoutsCompleted += p.netPayout;
      } else if (p.status === "REQUESTED" || p.status === "PROCESSING" || p.status === "APPROVED") {
        payoutsRequested += p.netPayout;
      }
    }

    // Fetch monthly TCS records
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

    return NextResponse.json({
      success: true,
      summary: {
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
      },
      vendorLedgers: Array.from(vendorMetrics.values()),
    });
  } catch (error: any) {
    console.error("Failed to fetch reconciliation stats:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch reconciliation stats" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
