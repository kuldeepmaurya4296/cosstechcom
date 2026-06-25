import mongoose from "mongoose";
import Category from "./models/Category";
import VendorProfile from "./models/VendorProfile";
import TcsReport from "./models/TcsReport";

export interface CommissionResult {
  commissionRate: number;
  commissionAmount: number;
  tcsRate: number;
  tcsAmount: number;
  netPayout: number;
}

/**
 * Calculates platform commission and TCS (Tax Collected at Source) for a vendor sale.
 */
export async function calculateCommissionAndTcs(
  subtotal: number,
  categoryId: string | mongoose.Types.ObjectId,
  vendorId: string | mongoose.Types.ObjectId
): Promise<CommissionResult> {
  try {
    // 1. Get Commission Rate (check category, fallback to 10%)
    let commissionRate = 10;
    if (categoryId) {
      const category = await Category.findById(categoryId).lean();
      if (category && typeof category.commissionRate === "number") {
        commissionRate = category.commissionRate;
      }
    }

    // 2. Get Vendor TCS Rate (from VendorProfile, fallback to 0.5% default)
    let tcsRate = 0.5;
    const vendorProfile = await VendorProfile.findOne({ userId: vendorId }).lean();
    if (vendorProfile && typeof vendorProfile.tcsRate === "number") {
      tcsRate = vendorProfile.tcsRate;
    }

    const commissionAmount = Math.round(subtotal * (commissionRate / 100));
    const tcsAmount = Math.round(subtotal * (tcsRate / 100));
    const netPayout = Math.max(0, subtotal - commissionAmount - tcsAmount);

    return {
      commissionRate,
      commissionAmount,
      tcsRate,
      tcsAmount,
      netPayout,
    };
  } catch (err) {
    console.error("Error in calculateCommissionAndTcs:", err);
    // Safe fallbacks on failure
    const commissionAmount = Math.round(subtotal * 0.1);
    const tcsAmount = Math.round(subtotal * 0.005);
    return {
      commissionRate: 10,
      commissionAmount,
      tcsRate: 0.5,
      tcsAmount,
      netPayout: Math.max(0, subtotal - commissionAmount - tcsAmount),
    };
  }
}

/**
 * Atomic helper to update the monthly TCS report for a vendor.
 * Net sales net = grossSales - returnsAmount.
 */
export async function recordTcsTransaction(
  vendorId: string | mongoose.Types.ObjectId,
  amount: number,
  isRefund: boolean = false
): Promise<boolean> {
  try {
    const month = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
    
    // Get vendor's TCS rate
    let tcsRate = 0.5;
    const vendorProfile = await VendorProfile.findOne({ userId: vendorId }).lean();
    if (vendorProfile && typeof vendorProfile.tcsRate === "number") {
      tcsRate = vendorProfile.tcsRate;
    }

    const tcsVal = Math.round(amount * (tcsRate / 100));

    await TcsReport.findOneAndUpdate(
      { vendorId, month },
      {
        $inc: {
          grossSales: isRefund ? 0 : amount,
          returnsAmount: isRefund ? amount : 0,
          netSales: isRefund ? -amount : amount,
          tcsAmount: isRefund ? -tcsVal : tcsVal,
        },
      },
      { upsert: true, new: true }
    );

    return true;
  } catch (err) {
    console.error("Failed to record TCS transaction:", err);
    return false;
  }
}
