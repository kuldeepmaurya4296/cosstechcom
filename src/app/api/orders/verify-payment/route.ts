import { NextResponse } from "next/server";
import crypto from "crypto";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { ensureDbReady } from "@/lib/db-utils";
import { commitInventory } from "@/lib/inventory";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId, // Local order ID (e.g. COSS-...)
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json({ error: "Missing verification parameters" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      if (process.env.DEMO_MODE === "true") {
        console.warn(
          "RAZORPAY_KEY_SECRET not set. Proceeding with simulated validation (DEMO_MODE=true).",
        );
      } else {
        console.error("RAZORPAY_KEY_SECRET not set. Rejecting payment verification.");
        return NextResponse.json(
          { error: "Payment verification service is not configured. Please contact support." },
          { status: 503 },
        );
      }
    } else {
      // Verify signature
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json(
          { error: "Payment verification failed: Invalid signature" },
          { status: 400 },
        );
      }
    }

    const { db, isReady } = await ensureDbReady();

    // If database is offline, only simulate success if in DEMO_MODE
    if (!isReady) {
      if (process.env.DEMO_MODE === "true") {
        console.warn(
          "Database offline during verification. Simulating payment verification success (DEMO_MODE=true).",
        );
        return NextResponse.json({
          success: true,
          message: "Payment verified successfully (Simulated - Database Offline)",
          order: {
            orderId,
            payment: {
              status: "PAID",
            },
            status: "CONFIRMED",
          },
        });
      }

      console.error("Database offline during verification and DEMO_MODE is not enabled.");
      return NextResponse.json(
        {
          error:
            "Payment verification service is temporarily unavailable. Please contact support if your payment was deducted.",
        },
        { status: 503 },
      );
    }

    // Update order status in database
    const order = await Order.findOne({ orderId });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order payment is already PAID to avoid double-processing
    if (order.payment.status === "PAID") {
      return NextResponse.json({ success: true, message: "Payment already verified", order });
    }

    order.payment.razorpayOrderId = razorpay_order_id;
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.status = "PAID";
    order.status = "CONFIRMED";
    order.statusHistory.push({
      status: "CONFIRMED",
      timestamp: new Date(),
      note: `Payment verified. Transaction ID: ${razorpay_payment_id}`,
    });

    await order.save();

    // Commit inventory holds
    for (const item of order.items) {
      await commitInventory(item.productId, item.size, item.color, orderId);
    }

    // Send order confirmation email asynchronously
    try {
      const User = (await import("@/lib/models/User")).default;
      const customer = await User.findById(order.userId).select("email").lean();
      if (customer?.email) {
        const { sendOrderConfirmationEmail } = await import("@/lib/email");
        sendOrderConfirmationEmail(customer.email, order).catch((err) =>
          console.error("Order confirmation email error:", err),
        );
      }
    } catch (emailErr) {
      console.error("Failed to send order confirmation email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during payment verification" },
      { status: 500 },
    );
  }
}
