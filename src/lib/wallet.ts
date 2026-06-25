import mongoose from "mongoose";
import Wallet from "./models/Wallet";
import WalletTransaction from "./models/WalletTransaction";
import User from "./models/User";

/**
 * Credit user's wallet and log the transaction.
 */
export async function creditUserWallet(
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  description: string,
  referenceType: 'order' | 'refund' | 'payout' | 'referral' | 'manual',
  referenceId?: string,
  sessionOptions: any = {}
) {
  if (amount <= 0) {
    throw new Error("Credit amount must be greater than zero");
  }

  // 1. Find or create wallet
  let wallet = await Wallet.findOne({ userId }).session(sessionOptions.session || null);
  if (!wallet) {
    wallet = new Wallet({
      userId,
      balance: 0,
      isActive: true,
    });
  }

  // 2. Increment wallet balance
  wallet.balance = Math.round((wallet.balance + amount) * 100) / 100;
  await wallet.save(sessionOptions);

  // 3. Create wallet transaction log
  const transaction = await WalletTransaction.create(
    [
      {
        walletId: wallet._id,
        type: "credit",
        amount,
        balanceAfter: wallet.balance,
        description,
        referenceType,
        referenceId,
        status: "completed",
      },
    ],
    sessionOptions
  );

  // 4. Keep User.walletBalance in sync
  await User.findByIdAndUpdate(
    userId,
    { $set: { walletBalance: wallet.balance } },
    sessionOptions
  );

  return { wallet, transaction: transaction[0] };
}

/**
 * Debit user's wallet and log the transaction.
 */
export async function debitUserWallet(
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  description: string,
  referenceType: 'order' | 'refund' | 'payout' | 'referral' | 'manual',
  referenceId?: string,
  sessionOptions: any = {}
) {
  if (amount <= 0) {
    throw new Error("Debit amount must be greater than zero");
  }

  // 1. Find or create wallet
  let wallet = await Wallet.findOne({ userId }).session(sessionOptions.session || null);
  if (!wallet) {
    wallet = new Wallet({
      userId,
      balance: 0,
      isActive: true,
    });
  }

  // 2. Verify balance
  if (wallet.balance < amount) {
    throw new Error(`Insufficient wallet balance. Available: ₹${wallet.balance}, requested: ₹${amount}`);
  }

  // 3. Decrement wallet balance
  wallet.balance = Math.round((wallet.balance - amount) * 100) / 100;
  await wallet.save(sessionOptions);

  // 4. Create wallet transaction log
  const transaction = await WalletTransaction.create(
    [
      {
        walletId: wallet._id,
        type: "debit",
        amount,
        balanceAfter: wallet.balance,
        description,
        referenceType,
        referenceId,
        status: "completed",
      },
    ],
    sessionOptions
  );

  // 5. Keep User.walletBalance in sync
  await User.findByIdAndUpdate(
    userId,
    { $set: { walletBalance: wallet.balance } },
    sessionOptions
  );

  return { wallet, transaction: transaction[0] };
}
