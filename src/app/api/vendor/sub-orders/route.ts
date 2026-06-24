import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import SubOrder from "@/lib/models/SubOrder";
import Order from "@/lib/models/Order"; // Register parent Order model
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const subOrders = await SubOrder.find({ vendorId: session.user.id })
      .sort({ createdAt: -1 })
      .populate("parentOrderId")
      .lean();

    return NextResponse.json(subOrders);
  } catch (error: any) {
    console.error("Failed to fetch vendor sub-orders:", error);
    return NextResponse.json({ error: "Failed to fetch sub-orders" }, { status: 500 });
  }
}
