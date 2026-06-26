import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Wallet from "@/lib/models/Wallet";
import WalletTransaction from "@/lib/models/WalletTransaction";
import { auth } from "@/lib/auth";
import { creditUserWallet } from "@/lib/wallet";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const userId = session.user.id;

    // Find or create wallet
    let wallet = await Wallet.findOne({ userId }).lean();
    if (!wallet) {
      // Create empty wallet in database
      const newWalletDoc = await Wallet.create({
        userId,
        balance: 0,
        isActive: true,
      });
      wallet = newWalletDoc.toObject();
    }

    // Fetch transaction logs
    const transactions = await WalletTransaction.find({ walletId: wallet._id })
      .sort({ createdAt: -1 })
      .lean();

    const history = transactions.map((t: any) => ({
      id: t._id.toString(),
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      description: t.description,
      referenceType: t.referenceType,
      referenceId: t.referenceId || null,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({
      balance: wallet.balance,
      isActive: wallet.isActive,
      history,
    });
  } catch (error: any) {
    console.error("Failed to fetch customer wallet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch wallet information" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await request.json();
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    await connectToDatabase();

    // Credit user's wallet
    const result = await creditUserWallet(
      session.user.id,
      amount,
      `Simulated manual wallet top-up of ₹${amount}`,
      "manual"
    );

    return NextResponse.json({
      success: true,
      balance: result.wallet.balance,
      transaction: result.transaction,
    });
  } catch (error: any) {
    console.error("Failed to add money to wallet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to top up wallet" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
