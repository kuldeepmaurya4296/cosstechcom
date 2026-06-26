import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Dispute from "@/lib/models/Dispute";
import SubOrder from "@/lib/models/SubOrder";
import Counter from "@/lib/models/Counter";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const disputes = await Dispute.find({ customerId: session.user.id })
      .populate("vendorId", "name storeName")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(disputes);
  } catch (error: any) {
    console.error("Failed to fetch customer disputes:", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subOrderId, type, description, evidenceImages } = await request.json();
    if (!subOrderId || !type || !description?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate type enum
    const validTypes = ["WRONG_ITEM", "DAMAGED", "NOT_DELIVERED", "QUALITY", "OTHER"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid dispute type" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the sub-order
    const subOrder = await SubOrder.findById(subOrderId);
    if (!subOrder) {
      return NextResponse.json({ error: "Sub-order not found" }, { status: 404 });
    }

    // Find the parent order to verify ownership
    const parentOrder = await Order.findById(subOrder.parentOrderId);
    if (!parentOrder || parentOrder.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized. Order does not belong to you." }, { status: 403 });
    }

    // Check if a dispute already exists for this sub-order
    const existingDispute = await Dispute.findOne({ subOrderId: subOrder._id });
    if (existingDispute) {
      return NextResponse.json({ error: "A dispute has already been raised for this sub-order." }, { status: 400 });
    }

    // Generate disputeId sequence
    const counter = (await Counter.findOneAndUpdate(
      { _id: "disputeId" },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    )) as any;
    const disputeId = `DISP-${String(counter?.seq || 1).padStart(5, "0")}`;

    const dispute = await Dispute.create({
      disputeId,
      orderId: parentOrder._id,
      orderSeqId: parentOrder.orderId,
      subOrderId: subOrder._id,
      subOrderSeqId: subOrder.subOrderId,
      customerId: session.user.id,
      vendorId: subOrder.vendorId,
      type,
      description: description.trim(),
      evidenceImages: evidenceImages || [],
      status: "OPEN",
      messages: [
        {
          sender: "customer",
          senderId: session.user.id,
          senderName: session.user.name || "Customer",
          message: `Dispute opened. Reason: ${description.trim()}`,
          timestamp: new Date(),
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Dispute opened successfully!",
      dispute,
    });
  } catch (error: any) {
    console.error("Failed to open dispute:", error);
    return NextResponse.json({ error: error.message || "Failed to open dispute" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
