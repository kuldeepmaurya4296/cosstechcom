import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Dispute from "@/lib/models/Dispute";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";
import { logAdminActivity } from "@/lib/activity-logger";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "support")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const disputes = await Dispute.find()
      .populate("customerId", "name email")
      .populate("vendorId", "name storeName")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(disputes);
  } catch (error: any) {
    console.error("Failed to fetch disputes:", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "support")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { disputeId, action, agentId, status, resolution, message } = body;

    if (!disputeId || !action) {
      return NextResponse.json({ error: "Missing disputeId or action parameter" }, { status: 400 });
    }

    const disputeDoc = await Dispute.findOne({ disputeId });
    if (!disputeDoc) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const performerName = session.user.name || "Support Agent";

    if (action === "assign") {
      if (!agentId) {
        return NextResponse.json({ error: "Agent ID is required for assignment" }, { status: 400 });
      }
      disputeDoc.assignedTo = agentId;
      disputeDoc.status = "INVESTIGATING";
      disputeDoc.messages.push({
        sender: session.user.role as any,
        senderId: session.user.id as any,
        senderName: performerName,
        message: `Dispute assigned to agent (User ID: ${agentId})`,
        timestamp: new Date(),
      });
    } else if (action === "status") {
      if (!status) {
        return NextResponse.json({ error: "Status value is required" }, { status: 400 });
      }
      disputeDoc.status = status;
      disputeDoc.messages.push({
        sender: session.user.role as any,
        senderId: session.user.id as any,
        senderName: performerName,
        message: `Dispute status changed to ${status}`,
        timestamp: new Date(),
      });
    } else if (action === "message") {
      if (!message) {
        return NextResponse.json({ error: "Message content is required" }, { status: 400 });
      }
      disputeDoc.messages.push({
        sender: session.user.role as any,
        senderId: session.user.id as any,
        senderName: performerName,
        message: message,
        timestamp: new Date(),
      });
    } else if (action === "resolve") {
      if (!resolution || !resolution.action) {
        return NextResponse.json({ error: "Resolution action is required" }, { status: 400 });
      }

      disputeDoc.status = "RESOLVED";
      disputeDoc.resolution = {
        action: resolution.action,
        refundAmount: resolution.refundAmount || 0,
        walletCredit: resolution.walletCredit || 0,
        vendorPenalty: resolution.vendorPenalty || 0,
        resolvedAt: new Date(),
        resolvedBy: session.user.id as any,
      };

      disputeDoc.messages.push({
        sender: session.user.role as any,
        senderId: session.user.id as any,
        senderName: performerName,
        message: `Dispute resolved: ${resolution.action}. Note: ${resolution.remarks || "No comments"}`,
        timestamp: new Date(),
      });

      // 1. Process customer wallet credit if chosen
      if (resolution.action === "REFUND_WALLET" && resolution.walletCredit > 0) {
        await User.findByIdAndUpdate(disputeDoc.customerId, {
          $inc: { walletBalance: Number(resolution.walletCredit) },
        });
      }

      // 2. Process vendor penalty deduction if chosen
      if (resolution.vendorPenalty > 0 && disputeDoc.vendorId) {
        await User.findByIdAndUpdate(disputeDoc.vendorId, {
          $inc: { walletBalance: -Number(resolution.vendorPenalty) },
        });
      }
    } else {
      return NextResponse.json({ error: "Invalid dispute action" }, { status: 400 });
    }

    await disputeDoc.save();

    await logAdminActivity({
      action: `DISPUTE_${action.toUpperCase()}`,
      details: `Processed action ${action} for dispute ${disputeId}`,
    });

    return NextResponse.json({ success: true, dispute: disputeDoc });
  } catch (error: any) {
    console.error("Failed to moderate dispute:", error);
    return NextResponse.json({ error: error.message || "Failed to moderate dispute" }, { status: 500 });
  }
}
