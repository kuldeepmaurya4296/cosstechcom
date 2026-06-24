import mongoose from "mongoose";
import SubOrder from "@/lib/models/SubOrder";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import LoyaltyPoints from "@/lib/models/LoyaltyPoints";
import Payout from "@/lib/models/Payout";
import Counter from "@/lib/models/Counter";
import Order from "@/lib/models/Order";

/**
 * Splits an amount proportionally based on subtotals.
 * Adjusts the last non-zero element to ensure the sum matches totalAmount.
 */
export function splitAmountProportionally(
  totalAmount: number,
  subtotals: number[],
  totalSubtotal: number
): number[] {
  if (totalSubtotal === 0 || totalAmount === 0) {
    return subtotals.map(() => 0);
  }

  let sum = 0;
  const split = subtotals.map((sub, idx) => {
    if (idx === subtotals.length - 1) {
      return totalAmount - sum;
    }
    const amt = Math.round((sub / totalSubtotal) * totalAmount);
    sum += amt;
    return amt;
  });

  return split;
}

/**
 * Transition a sub-order's status and perform all side effects (wallet credits, loyalty points, stock changes, payout ledger).
 */
export async function transitionSubOrderStatus(
  subOrderId: string | mongoose.Types.ObjectId,
  nextStatus: string,
  sessionOptions: any = {},
  performedBy: string | mongoose.Types.ObjectId,
  note?: string
) {
  const subOrder = await SubOrder.findById(subOrderId).session(sessionOptions.session || null);
  if (!subOrder) {
    throw new Error("Sub-order not found");
  }

  const currentStatus = subOrder.status;
  if (currentStatus === nextStatus && !note) {
    return subOrder;
  }

  // Fetch parent order for customer ID and details
  const parentOrder = await Order.findById(subOrder.parentOrderId).session(sessionOptions.session || null);
  if (!parentOrder) {
    throw new Error("Parent order not found");
  }

  // 1. Process Stock Rollback on Cancellation / Return
  if (
    (nextStatus === "CANCELLED" && currentStatus !== "CANCELLED") ||
    (nextStatus === "RETURNED" && currentStatus !== "RETURNED")
  ) {
    for (const item of subOrder.items) {
      await Product.updateOne(
        {
          _id: item.productId,
          variants: {
            $elemMatch: { size: item.size, color: item.color },
          },
        },
        {
          $inc: { "variants.$.stock": item.qty },
        },
        sessionOptions
      );
    }
  }

  // 2. Process side effects when transitioning to DELIVERED
  if (nextStatus === "DELIVERED" && currentStatus !== "DELIVERED") {
    subOrder.deliveredAt = new Date();

    // Credit Vendor Wallet
    await User.findByIdAndUpdate(
      subOrder.vendorId,
      {
        $inc: { walletBalance: subOrder.pricing.vendorPayout },
      },
      sessionOptions
    );

    // Award Loyalty Points (5% of sub-order total)
    const earnedPoints = Math.round((subOrder.pricing.total || 0) * 0.05);
    if (earnedPoints > 0) {
      await LoyaltyPoints.create(
        [
          {
            userId: parentOrder.userId,
            points: earnedPoints,
            type: "EARNED",
            orderId: parentOrder.orderId,
            description: `Earned points on delivery of sub-order #${subOrder.subOrderId}`,
          },
        ],
        sessionOptions
      );
    }

    const counter = (await Counter.findOneAndUpdate(
      { _id: "payoutId" },
      { $inc: { seq: 1 } },
      { upsert: true, new: true, ...sessionOptions }
    )) as any;
    const payoutSeqId = `PAY-${String(counter?.seq || 1).padStart(5, "0")}`;

    const payoutDocs = await Payout.create(
      [
        {
          payoutId: payoutSeqId,
          vendorId: subOrder.vendorId,
          amount: subOrder.pricing.total,
          commissionDeducted: subOrder.pricing.platformCommission,
          netPayout: subOrder.pricing.vendorPayout,
          subOrderIds: [subOrder._id],
          status: "REQUESTED",
          requestedAt: new Date(),
          remarks: `Auto-generated ledger entry on delivery of sub-order #${subOrder.subOrderId}`,
        },
      ],
      sessionOptions
    );

    subOrder.payoutId = payoutDocs[0]._id;
    subOrder.payoutStatus = "PENDING";
  }

  // 3. Rollback side effects if transitioning away from DELIVERED to CANCELLED/RETURNED
  if (
    currentStatus === "DELIVERED" &&
    (nextStatus === "CANCELLED" || nextStatus === "RETURNED" || nextStatus === "REFUNDED")
  ) {
    // Debit Vendor Wallet
    await User.findByIdAndUpdate(
      subOrder.vendorId,
      {
        $inc: { walletBalance: -subOrder.pricing.vendorPayout },
      },
      sessionOptions
    );

    // Reverse Loyalty Points
    const earnedPoints = Math.round((subOrder.pricing.total || 0) * 0.05);
    if (earnedPoints > 0) {
      await LoyaltyPoints.create(
        [
          {
            userId: parentOrder.userId,
            points: -earnedPoints,
            type: "REFUNDED",
            orderId: parentOrder.orderId,
            description: `Deducted points due to return/cancellation of sub-order #${subOrder.subOrderId}`,
          },
        ],
        sessionOptions
      );
    }

    // Update Payout Status to FAILED
    if (subOrder.payoutId) {
      await Payout.findByIdAndUpdate(
        subOrder.payoutId,
        {
          status: "FAILED",
          remarks: `Payout cancelled/refunded because sub-order #${subOrder.subOrderId} was ${nextStatus}`,
        },
        sessionOptions
      );
      subOrder.payoutStatus = "PENDING";
    }
  }

  // Update Status and History
  subOrder.status = nextStatus as any;
  subOrder.statusHistory.push({
    status: nextStatus,
    timestamp: new Date(),
    note: note || `Status updated to ${nextStatus}`,
  });

  await subOrder.save(sessionOptions);

  // Synchronize Parent Order status after this sub-order status transition
  await syncParentOrderStatus(subOrder.parentOrderId, sessionOptions);

  return subOrder;
}

/**
 * Synchronizes parent order status based on all child sub-orders.
 */
export async function syncParentOrderStatus(
  parentOrderId: mongoose.Types.ObjectId | string,
  sessionOptions: any = {}
) {
  const order = await Order.findById(parentOrderId).session(sessionOptions.session || null);
  if (!order) return;

  const subOrders = await SubOrder.find({ parentOrderId: order._id }).session(sessionOptions.session || null);
  if (subOrders.length === 0) return;

  const statuses = subOrders.map((so) => so.status);

  let newStatus = order.status;

  if (statuses.every((s) => s === "DELIVERED")) {
    newStatus = "DELIVERED";
  } else if (statuses.every((s) => s === "CANCELLED")) {
    newStatus = "CANCELLED";
  } else if (statuses.every((s) => s === "RETURNED")) {
    newStatus = "RETURNED";
  } else if (statuses.every((s) => s === "REFUNDED")) {
    newStatus = "REFUNDED";
  } else if (statuses.every((s) => s === "SHIPPED" || s === "DELIVERED" || s === "OUT_FOR_DELIVERY")) {
    newStatus = "SHIPPED";
  } else if (
    statuses.some((s) =>
      ["CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(s)
    )
  ) {
    newStatus = "CONFIRMED";
  }

  if (newStatus !== order.status) {
    const oldStatus = order.status;
    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      note: `Main order status automatically updated from ${oldStatus} to ${newStatus} based on sub-orders.`,
    });

    // Handle overall order payment status updates if needed
    if (newStatus === "DELIVERED" && order.payment.method === "COD") {
      order.payment.status = "PAID";
    }

    await order.save(sessionOptions);
  }
}
