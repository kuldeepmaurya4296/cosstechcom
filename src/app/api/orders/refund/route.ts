import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import RefundRequest from "@/lib/models/RefundRequest";
import Order from "@/lib/models/Order";
import SubOrder from "@/lib/models/SubOrder";
import { processRefund } from "@/lib/refund";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { subOrderId, amount, reason, refundMethod } = body;

    if (!subOrderId || !amount || !reason || !refundMethod) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const subOrder = await SubOrder.findById(subOrderId);
    if (!subOrder) {
      return NextResponse.json({ error: "Sub-order not found" }, { status: 404 });
    }

    const order = await Order.findById(subOrder.parentOrderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Authorization check: User must own the order or be an admin
    const isAdmin = session.user.role === "admin";
    if (order.userId.toString() !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized access to this order" }, { status: 403 });
    }

    // Verify refund amount doesn't exceed sub-order total
    if (amount > subOrder.pricing.total) {
      return NextResponse.json(
        { error: `Refund amount cannot exceed sub-order total: ₹${subOrder.pricing.total}` },
        { status: 400 }
      );
    }

    // Create the refund request
    const refundRequest = await RefundRequest.create({
      orderId: order._id,
      subOrderId: subOrder._id,
      customerId: order.userId,
      amount,
      reason,
      refundMethod,
      status: "pending",
    });

    // If admin is creating the request, auto-approve it immediately
    if (isAdmin) {
      const result = await processRefund(refundRequest._id.toString());
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: "Refund processed successfully",
          refundRequest,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || "Failed to process refund gateway payment",
          refundRequest,
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Refund request submitted successfully and is pending admin approval.",
      refundRequest,
    });
  } catch (error: any) {
    console.error("Failed to create refund request:", error);
    return NextResponse.json({ error: error.message || "Failed to create refund request" }, { status: 500 });
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
    const { refundRequestId, action, reason } = body;

    if (!refundRequestId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action or request ID" }, { status: 400 });
    }

    const refundReq = await RefundRequest.findById(refundRequestId);
    if (!refundReq) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    }

    if (refundReq.status !== "pending") {
      return NextResponse.json({ error: `Refund request already processed: status is ${refundReq.status}` }, { status: 400 });
    }

    if (action === "reject") {
      refundReq.status = "rejected";
      refundReq.rejectionReason = reason || "Rejected by administrator";
      refundReq.processedAt = new Date();
      refundReq.processedBy = new mongoose.Types.ObjectId(session.user.id) as any;
      await refundReq.save();
      return NextResponse.json({ success: true, message: "Refund request rejected", refundReq });
    }

    // Approve & execute refund
    refundReq.processedBy = new mongoose.Types.ObjectId(session.user.id) as any;
    await refundReq.save();

    const result = await processRefund(refundReq._id.toString());
    if (result.success) {
      return NextResponse.json({ success: true, message: "Refund approved and completed", refundReq });
    } else {
      return NextResponse.json({ success: false, error: result.error || "Failed to execute refund transfer" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Failed to moderate refund request:", error);
    return NextResponse.json({ error: error.message || "Failed to moderate refund request" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subOrderId = searchParams.get("subOrderId");

    await connectToDatabase();

    const isAdmin = session.user.role === "admin";
    let query: any = {};

    if (!isAdmin) {
      query.customerId = session.user.id;
    }

    if (subOrderId) {
      query.subOrderId = subOrderId;
    }

    const requests = await RefundRequest.find(query)
      .populate("orderId", "orderId")
      .populate("subOrderId", "subOrderId")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Failed to fetch refund requests:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch refund requests" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
