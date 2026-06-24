import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import LoyaltyPoints from "@/lib/models/LoyaltyPoints";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const userId = session.user.id;

    // Calculate total points balance
    const balanceResult = await LoyaltyPoints.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, balance: { $sum: "$points" } } },
    ]);

    const balance = balanceResult.length > 0 ? balanceResult[0].balance : 0;

    // Fetch transaction history
    const history = await LoyaltyPoints.find({ userId }).sort({ createdAt: -1 }).lean();

    const formattedHistory = history.map((log: any) => ({
      id: log._id.toString(),
      points: log.points,
      type: log.type,
      orderId: log.orderId || null,
      description: log.description || "",
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      balance,
      history: formattedHistory,
    });
  } catch (error: any) {
    console.error("Failed to fetch loyalty points:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch loyalty points" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
