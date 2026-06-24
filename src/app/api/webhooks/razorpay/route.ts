import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/models/Order";

import mongoose from "mongoose";
import { ensureDbReady } from "@/lib/db-utils";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret.includes("dummy")) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured. Rejecting webhook request.");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const body = JSON.parse(rawBody);
    const event = body.event;
    const payload = body.payload;

    console.log(`Received Razorpay webhook event: ${event}`);

    const { db, isReady } = await ensureDbReady();

    // If database is offline, skip updates but return 200 to Razorpay to avoid retries
    if (!isReady) {
      console.error(
        "Database offline during webhook processing. Returning 500 to trigger Razorpay retries.",
      );
      return NextResponse.json({ error: "Database offline" }, { status: 500 });
    }

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payment?.entity;
      const orderEntity = payload.order?.entity;

      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        const order = await Order.findOne({ "payment.razorpayOrderId": razorpayOrderId });
        if (order) {
          if (order.payment.status !== "PAID") {
            order.payment.status = "PAID";
            if (razorpayPaymentId) {
              order.payment.razorpayPaymentId = razorpayPaymentId;
            }
            order.status = "CONFIRMED";
            order.statusHistory.push({
              status: "CONFIRMED",
              timestamp: new Date(),
              note: `Webhook received: ${event}. Payment verified.`,
            });
            await order.save();
            console.log(`Order ${order.orderId} updated to PAID via Webhook.`);

            // Send order confirmation email asynchronously
            try {
              const User = (await import("@/lib/models/User")).default;
              const customer = await User.findById(order.userId).select("email").lean();
              if (customer?.email) {
                const { sendOrderConfirmationEmail } = await import("@/lib/email");
                sendOrderConfirmationEmail(customer.email, order).catch((err) =>
                  console.error("Order confirmation email error via Webhook:", err),
                );
              }
            } catch (emailErr) {
              console.error("Failed to send order confirmation email via Webhook:", emailErr);
            }
          }
        } else {
          console.warn(`Order not found for Razorpay Order ID: ${razorpayOrderId}`);
        }
      }
    } else if (event === "payment.failed") {
      const paymentEntity = payload.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;

      if (razorpayOrderId) {
        const order = await Order.findOne({ "payment.razorpayOrderId": razorpayOrderId });
        if (order && order.payment.status === "PENDING" && order.status === "PLACED") {
          console.log(
            `Webhook received: payment.failed for local order ${order.orderId}. Cancelling order and restoring stocks.`,
          );

          const Product = mongoose.models.Product || (await import("@/lib/models/Product")).default;

          // Rollback stock atomically
          for (const item of order.items) {
            await Product.updateOne(
              {
                _id: item.productId,
                "variants.size": item.size,
                "variants.color": item.color,
              },
              {
                $inc: { "variants.$.stock": item.qty },
              },
            );
          }

          order.status = "CANCELLED";
          order.payment.status = "FAILED";
          order.statusHistory.push({
            status: "CANCELLED",
            timestamp: new Date(),
            note: "Webhook received: payment.failed. Payment failed on gateway, order automatically cancelled.",
          });

          await order.save();
          console.log(`Order ${order.orderId} cancelled via Webhook due to payment failure.`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 },
    );
  }
}
export const dynamic = "force-dynamic";
