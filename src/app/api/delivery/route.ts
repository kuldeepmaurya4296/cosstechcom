import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import SubOrder from "@/lib/models/SubOrder";
import Order from "@/lib/models/Order"; // Register Order model
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";
import { transitionSubOrderStatus } from "@/lib/order-utils";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "delivery_partner" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch sub-orders assigned to this delivery partner
    const assignedSubOrders = await SubOrder.find({
      "shipping.deliveryPartnerId": session.user.id,
    })
      .sort({ updatedAt: -1 })
      .populate("parentOrderId")
      .lean();

    // Fetch sub-orders that are SHIPPED but have no delivery partner assigned (unclaimed pool)
    const unclaimedSubOrders = await SubOrder.find({
      status: "SHIPPED",
      $or: [
        { "shipping.deliveryPartnerId": { $exists: false } },
        { "shipping.deliveryPartnerId": null },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("parentOrderId")
      .lean();

    const mappedAssigned = assignedSubOrders.map((so: any) => ({
      ...so,
      parentOrder: so.parentOrderId,
    }));

    const mappedUnclaimed = unclaimedSubOrders.map((so: any) => ({
      ...so,
      parentOrder: so.parentOrderId,
    }));

    return NextResponse.json({
      assigned: mappedAssigned,
      unclaimed: mappedUnclaimed,
    });
  } catch (error: any) {
    console.error("Failed to fetch delivery sub-orders:", error);
    return NextResponse.json({ error: "Failed to fetch sub-orders" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "delivery_partner" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { id, action, status, note } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const subOrder = await SubOrder.findById(id);
    if (!subOrder) {
      return NextResponse.json({ error: "Sub-order not found" }, { status: 404 });
    }

    if (action === "claim") {
      // Assign delivery partner and set status to OUT_FOR_DELIVERY
      subOrder.shipping = {
        ...subOrder.shipping,
        deliveryPartnerId: new mongoose.Types.ObjectId(session.user.id) as any,
      };
      await subOrder.save();

      // Transition the sub-order status
      const updated = await transitionSubOrderStatus(
        id,
        "OUT_FOR_DELIVERY",
        {},
        session.user.id,
        note || "Delivery partner claimed package for delivery."
      );

      return NextResponse.json({ success: true, subOrder: updated });
    }

    if (action === "update_status") {
      if (!status) {
        return NextResponse.json({ error: "Missing status parameter" }, { status: 400 });
      }

      // Check if this partner is authorized to update this order
      if (subOrder.shipping?.deliveryPartnerId?.toString() !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized to update this sub-order" }, { status: 403 });
      }

      const updated = await transitionSubOrderStatus(
        id,
        status,
        {},
        session.user.id,
        note || `Delivery status updated to ${status} by delivery partner.`
      );

      return NextResponse.json({ success: true, subOrder: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Failed to perform delivery operation:", error);
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
  }
}
