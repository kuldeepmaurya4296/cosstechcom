import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Payout from "@/lib/models/Payout";
import User from "@/lib/models/User";
import Counter from "@/lib/models/Counter";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const payouts = await Payout.find({ vendorId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(payouts);
  } catch (error: any) {
    console.error("Failed to fetch payouts:", error);
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const amount = Number(body.amount);

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payout amount" }, { status: 400 });
    }

    const vendorUser = await User.findById(session.user.id);
    if (!vendorUser) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (vendorUser.walletBalance < amount) {
      return NextResponse.json(
        { error: `Insufficient wallet balance. Available: ₹${vendorUser.walletBalance}` },
        { status: 400 }
      );
    }

    // Generate sequential payoutId
    const counter = (await Counter.findOneAndUpdate(
      { _id: "payoutId" },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    )) as any;
    const payoutId = `PAY-${String(counter?.seq || 1).padStart(5, "0")}`;

    // Create Payout request
    const payout = await Payout.create({
      payoutId,
      vendorId: session.user.id,
      amount,
      commissionDeducted: 0,
      netPayout: amount,
      subOrderIds: [],
      status: "REQUESTED",
      requestedAt: new Date(),
      remarks: "Seller balance withdrawal request",
    });

    // Deduct from wallet balance
    vendorUser.walletBalance -= amount;
    await vendorUser.save();

    return NextResponse.json({ success: true, payout });
  } catch (error: any) {
    console.error("Failed to request payout:", error);
    return NextResponse.json({ error: error.message || "Payout request failed" }, { status: 500 });
  }
}
