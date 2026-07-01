import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Dispute from "@/lib/models/Dispute";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";
import { creditUserWallet, debitUserWallet } from "@/lib/wallet";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "support" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch disputes assigned to this agent
    const assignedDisputes = await Dispute.find({
      assignedTo: session.user.id,
    })
      .sort({ updatedAt: -1 })
      .populate("customerId", "name email")
      .populate("vendorId", "name email")
      .lean();

    // Fetch open disputes not yet assigned to anyone
    const openDisputes = await Dispute.find({
      status: "OPEN",
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("customerId", "name email")
      .populate("vendorId", "name email")
      .lean();

    return NextResponse.json({
      assigned: assignedDisputes,
      unclaimed: openDisputes,
    });
  } catch (error: any) {
    console.error("Failed to fetch support disputes:", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "support" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { id, action, message, resolutionAction, refundAmount, vendorPenalty, note } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return NextResponse.json({ error: "Dispute ticket not found" }, { status: 404 });
    }

    // 1. Claim a ticket
    if (action === "claim") {
      dispute.assignedTo = new mongoose.Types.ObjectId(session.user.id) as any;
      dispute.status = "INVESTIGATING";
      dispute.messages.push({
        sender: "support",
        senderId: new mongoose.Types.ObjectId(session.user.id) as any,
        senderName: session.user.name || "Support Agent",
        message: "Support agent has joined the dispute mediation and is investigating.",
        timestamp: new Date(),
      });

      await dispute.save();
      return NextResponse.json({ success: true, dispute });
    }

    // Gating for other actions (must be the assigned agent or admin)
    if (dispute.assignedTo?.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Ticket assigned to another agent." }, { status: 403 });
    }

    // 2. Add Message
    if (action === "add_message") {
      if (!message) {
        return NextResponse.json({ error: "Missing message text" }, { status: 400 });
      }

      dispute.messages.push({
        sender: "support",
        senderId: new mongoose.Types.ObjectId(session.user.id) as any,
        senderName: session.user.name || "Support Agent",
        message,
        timestamp: new Date(),
      });

      await dispute.save();
      return NextResponse.json({ success: true, dispute });
    }

    // 3. Resolve Dispute
    if (action === "resolve") {
      if (!resolutionAction) {
        return NextResponse.json({ error: "Missing resolution action" }, { status: 400 });
      }

      const numRefund = Number(refundAmount) || 0;
      const numPenalty = Number(vendorPenalty) || 0;

      dispute.status = "RESOLVED";
      dispute.resolution = {
        action: resolutionAction,
        refundAmount: numRefund,
        walletCredit: resolutionAction === "REFUND_WALLET" ? numRefund : 0,
        vendorPenalty: numPenalty,
        resolvedAt: new Date(),
        resolvedBy: new mongoose.Types.ObjectId(session.user.id) as any,
      };

      dispute.messages.push({
        sender: "support",
        senderId: new mongoose.Types.ObjectId(session.user.id) as any,
        senderName: session.user.name || "Support Agent",
        message: `Dispute resolved. Action: ${resolutionAction}. Refund: INR ${numRefund}. Penalty: INR ${numPenalty}. ${note || ""}`,
        timestamp: new Date(),
      });
      // Side Effect: Wallet Credit to Customer
      if (resolutionAction === "REFUND_WALLET" && numRefund > 0) {
        await creditUserWallet(
          dispute.customerId,
          numRefund,
          `Wallet refund for dispute ${dispute.disputeId}`,
          "refund",
          dispute._id.toString()
        );
      }

      // Side Effect: Penalty deduction from Vendor Wallet
      if (numPenalty > 0 && dispute.vendorId) {
        await debitUserWallet(
          dispute.vendorId,
          numPenalty,
          `Penalty deduction for dispute ${dispute.disputeId}`,
          "refund",
          dispute._id.toString()
        );
      }

      await dispute.save();
      return NextResponse.json({ success: true, dispute });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Support mediation failed:", error);
    return NextResponse.json({ error: error.message || "Mediation operation failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
