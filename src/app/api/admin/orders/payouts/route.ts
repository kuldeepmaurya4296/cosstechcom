import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import Payout from "@/lib/models/Payout";
import VendorProfile from "@/lib/models/VendorProfile";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "vendor")) {
      return new Response("Unauthorized. Administrative privileges required.", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const format = searchParams.get("format");

    await connectToDatabase();

    // If type is requests, return vendor payout requests from Payout model
    if (type === "requests") {
      const payouts = await Payout.find()
        .populate({ path: "vendorId", model: User, select: "name email" })
        .sort({ createdAt: -1 })
        .lean();

      // Fetch corresponding bank accounts from VendorProfile
      const vendorIds = payouts.map(p => p.vendorId?._id || p.vendorId).filter(Boolean);
      const profiles = await VendorProfile.find({ userId: { $in: vendorIds } })
        .select("userId bankAccount storeName")
        .lean();
      const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

      const enrichedPayouts = payouts.map(p => {
        const vId = p.vendorId?._id?.toString() || p.vendorId?.toString();
        const profile = vId ? profileMap.get(vId) : null;
        return {
          ...p,
          storeName: profile?.storeName || "Withdrawal",
          bankAccount: profile?.bankAccount || null
        };
      });

      return NextResponse.json(enrichedPayouts);
    }

    // Default to existing refund payouts export if format is CSV
    if (format === "csv" || !type) {
      const orders = await Order.find({ "payment.status": "REFUND_PENDING" })
        .populate({ path: "userId", model: User, select: "name email" })
        .lean();

      const csvRows = [
        [
          "Order ID",
          "Customer Name",
          "Customer Email",
          "Amount (INR)",
          "Original Payment Method",
          "Refund Preference",
          "UPI ID",
          "Beneficiary Name",
          "Account Number",
          "IFSC Code",
          "Bank Name",
          "Order Created At",
        ]
          .map((field) => `"${field.replace(/"/g, '""')}"`)
          .join(","),
      ];

      for (const order of orders) {
        const details = order.refundDetails || {};
        const bank = (details.bankDetails || {}) as any;
        const upiId = details.upiId || "";
        const preference = details.preference || "N/A";
        const totalAmount = order.pricing?.total || 0;

        const row = [
          order.orderId,
          (order.userId as any)?.name || "Guest",
          (order.userId as any)?.email || "",
          totalAmount.toString(),
          order.payment?.method || "",
          preference,
          upiId,
          bank.accountHolderName || "",
          bank.accountNumber || "",
          bank.ifscCode || "",
          bank.bankName || "",
          order.createdAt ? new Date(order.createdAt).toISOString() : "",
        ];

        csvRows.push(row.map((field) => `"${(field || "").replace(/"/g, '""')}"`).join(","));
      }

      const csvContent = csvRows.join("\n");
      const filename = `payouts_export_${new Date().toISOString().split("T")[0]}.csv`;

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("Failed to generate payouts data:", error);
    return new Response("Failed to generate payouts data: " + error.message, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { payoutId, status, bankTransactionId, remarks } = body;

    if (!payoutId || !status || !["APPROVED", "PROCESSING", "COMPLETED", "FAILED"].includes(status)) {
      return NextResponse.json({ error: "Invalid payout parameters" }, { status: 400 });
    }

    const payout = await Payout.findOne({ payoutId });
    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    payout.status = status;
    if (bankTransactionId) payout.bankTransactionId = bankTransactionId;
    if (remarks) payout.remarks = remarks;
    if (status === "COMPLETED") {
      payout.processedAt = new Date();
      payout.processedBy = new mongoose.Types.ObjectId(session.user.id) as any;
    }

    await payout.save();

    return NextResponse.json({ success: true, payout });
  } catch (error: any) {
    console.error("Failed to update payout status:", error);
    return NextResponse.json({ error: error.message || "Failed to update payout" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
