import Razorpay from "razorpay";
import Order from "./models/Order";
import SubOrder from "./models/SubOrder";
import RefundRequest from "./models/RefundRequest";
import { creditUserWallet } from "./wallet";
import { recordTcsTransaction } from "./commission";

/**
 * Core refund processing engine.
 * Handles payment reversals to source (via Razorpay) or credits to customer wallet.
 */
export async function processRefund(
  refundRequestId: string
): Promise<{ success: boolean; gatewayTransactionId?: string; error?: string }> {
  try {
    const refundReq = await RefundRequest.findById(refundRequestId);
    if (!refundReq) {
      return { success: false, error: "Refund request not found" };
    }

    if (refundReq.status === "completed") {
      return { success: true, gatewayTransactionId: refundReq.gatewayTransactionId };
    }

    const order = await Order.findById(refundReq.orderId);
    if (!order) {
      return { success: false, error: "Parent order not found" };
    }

    refundReq.status = "processing";
    await refundReq.save();

    let gatewayTransactionId = `REF_${Date.now()}`;
    let success = false;

    // 1. Wallet Refund Flow
    if (refundReq.refundMethod === "wallet") {
      try {
        await creditUserWallet(
          refundReq.customerId,
          refundReq.amount,
          `Refund for Order #${order.orderId}`,
          "refund",
          refundReq.id.toString()
        );
        success = true;
        gatewayTransactionId = `WAL_REF_${Date.now()}`;
      } catch (walletErr: any) {
        console.error("Wallet credit refund failed:", walletErr);
        refundReq.status = "failed";
        await refundReq.save();
        return { success: false, error: "Failed to credit customer wallet" };
      }
    } else {
      // 2. Original Source Refund Flow (Razorpay / Simulation fallback)
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      const paymentId = order.payment?.razorpayPaymentId;

      if (keyId && keySecret && paymentId && !paymentId.startsWith("fake_") && !paymentId.startsWith("sim_")) {
        try {
          const rzp = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
          });
          
          const refund = await rzp.payments.refund(paymentId, {
            amount: Math.round(refundReq.amount * 100), // convert to paise
            notes: {
              reason: refundReq.reason || "Customer Return/Cancellation Refund",
              refundRequestId: refundReq.id.toString(),
            },
          });
          
          gatewayTransactionId = refund.id;
          success = true;
        } catch (rzpErr: any) {
          console.error("Razorpay API refund request failed:", rzpErr);
          refundReq.status = "failed";
          refundReq.rejectionReason = rzpErr.message || "Gateway error during refund";
          await refundReq.save();
          return { success: false, error: rzpErr.message || "Gateway refund failed" };
        }
      } else {
        // SIMULATION MODE
        console.warn(`[Refund Simulation] Simulating source refund of ₹${refundReq.amount} for Order ${order.orderId}`);
        gatewayTransactionId = `SIM_REF_${Math.floor(100000 + Math.random() * 900000)}`;
        success = true;
      }
    }

    if (success) {
      refundReq.status = "completed";
      refundReq.gatewayTransactionId = gatewayTransactionId;
      refundReq.processedAt = new Date();
      await refundReq.save();

      // Update Parent Order refund status
      order.payment.status = "REFUNDED";
      if (!order.refundDetails) {
        order.refundDetails = {
          method: refundReq.refundMethod === "wallet" ? "WALLET" : "ONLINE",
          transactionId: gatewayTransactionId,
          refundedAt: new Date(),
        };
      }
      await order.save();

      // Update SubOrder status to REFUNDED
      const subOrder = await SubOrder.findById(refundReq.subOrderId);
      if (subOrder) {
        subOrder.status = "REFUNDED";
        subOrder.statusHistory.push({
          status: "REFUNDED",
          timestamp: new Date(),
          note: `Refund completed. Txn: ${gatewayTransactionId}`,
        });
        await subOrder.save();

        // Adjust TCS ledger since this is a return/refund
        await recordTcsTransaction(subOrder.vendorId, refundReq.amount, true);
      }

      return { success: true, gatewayTransactionId };
    }

    return { success: false, error: "Refund could not be finalized" };
  } catch (err: any) {
    console.error("Failed to process refund:", err);
    return { success: false, error: err.message || "Internal error during refund processing" };
  }
}
