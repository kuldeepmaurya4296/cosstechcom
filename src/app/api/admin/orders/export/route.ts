import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User"; // Required for populate registration
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const orders = await Order.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const csvHeaders = [
      "Order ID",
      "Customer Name",
      "Customer Email",
      "Items Count",
      "Items Summary",
      "Subtotal",
      "Shipping",
      "Coupon Code",
      "Coupon Discount",
      "Points Discount",
      "Tax Rate (%)",
      "Tax",
      "Total",
      "Status",
      "Payment Method",
      "Payment Status",
      "Date",
    ];

    const rows = [csvHeaders.join(",")];

    for (const order of orders as any[]) {
      const itemsSummary = order.items
        .map((item: any) => `${item.name} (${item.size}, ${item.color}) x${item.qty}`)
        .join("; ");

      const row = [
        order.orderId,
        order.userId?.name || "Deleted User",
        order.userId?.email || "N/A",
        order.items.length,
        itemsSummary,
        order.pricing.subtotal,
        order.pricing.shipping,
        order.coupon?.code || "",
        order.pricing.couponDiscount,
        order.pricing.pointsDiscount || 0,
        order.pricing.taxRate || 0,
        order.pricing.tax || 0,
        order.pricing.total,
        order.status,
        order.payment.method,
        order.payment.status,
        new Date(order.createdAt).toISOString().split("T")[0],
      ];

      rows.push(row.map(escapeCSV).join(","));
    }

    const csvContent = rows.join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="orders_export.csv"',
      },
    });
  } catch (error: any) {
    console.error("Failed to export orders:", error);
    return NextResponse.json({ error: "Failed to export orders" }, { status: 500 });
  }
}

function escapeCSV(val: any): string {
  if (val == null) return "";
  let str = String(val);
  str = str.replace(/"/g, '""');
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
}

export const dynamic = "force-dynamic";
