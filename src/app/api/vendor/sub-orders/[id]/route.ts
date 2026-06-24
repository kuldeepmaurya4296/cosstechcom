import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import SubOrder from "@/lib/models/SubOrder";
import { auth } from "@/lib/auth";
import { transitionSubOrderStatus } from "@/lib/order-utils";

const ALLOWED_VENDOR_STATUSES = [
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_APPROVED",
];

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await context.params;
    const { status, note } = await request.json();

    if (!status) {
      return NextResponse.json({ error: "Missing status parameter" }, { status: 400 });
    }

    if (!ALLOWED_VENDOR_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status transition request" }, { status: 400 });
    }

    const subOrder = await SubOrder.findById(id);
    if (!subOrder) {
      return NextResponse.json({ error: "Sub-order not found" }, { status: 404 });
    }

    if (subOrder.vendorId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to this sub-order" },
        { status: 403 }
      );
    }

    // Perform state transition
    const updatedSubOrder = await transitionSubOrderStatus(
      id,
      status,
      {},
      session.user.id,
      note || `Status updated to ${status} by seller.`
    );

    return NextResponse.json({ success: true, subOrder: updatedSubOrder });
  } catch (error: any) {
    console.error("Failed to update sub-order status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
