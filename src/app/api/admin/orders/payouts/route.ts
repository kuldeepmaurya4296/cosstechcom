import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "vendor")) {
      return new Response("Unauthorized. Administrative privileges required.", { status: 401 });
    }

    await connectToDatabase();

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
  } catch (error: any) {
    console.error("Failed to generate payouts CSV:", error);
    return new Response("Failed to generate payouts CSV: " + error.message, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
