import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/models/Order";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currency = "INR", receipt } = body;

    // receipt is the local orderId (RBH-XXXXX). It must reference a real order.
    if (!receipt) {
      return NextResponse.json({ error: "Order reference (receipt) is required" }, { status: 400 });
    }

    // Authenticate caller
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Look up the order created server-side with a verified total.
    // The charge amount is ALWAYS derived from the stored order, never from the client body.
    const order = await Order.findOne({ orderId: receipt });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Ownership check — only the placing customer may initiate payment for this order.
    if (order.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Already paid — block re-charge.
    if (order.payment?.status === "PAID") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 409 });
    }

    const amount = order.pricing.total;
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });
    }
    // Razorpay amount is in paise (lowest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.warn(
        "Razorpay environment variables are missing. Simulating Razorpay order creation.",
      );
      const fakeRzpOrderId = `fake_rzp_order_${Date.now()}`;
      try {
        const updateResult = await Order.updateOne(
          { orderId: receipt },
          { "payment.razorpayOrderId": fakeRzpOrderId },
        );
        console.log(
          `Associated simulated Razorpay order ID ${fakeRzpOrderId} with local order ${receipt}. Modified count: ${updateResult.modifiedCount}`,
        );
      } catch (dbErr) {
        console.error("Failed to associate fake razorpayOrderId with local order:", dbErr);
      }
      return NextResponse.json({
        id: fakeRzpOrderId,
        amount: amountInPaise,
        currency,
        receipt,
        simulated: true,
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: amountInPaise,
      currency,
      receipt,
    };

    const rzpOrder = await razorpay.orders.create(options);

    // Save razorpayOrderId to MongoDB Order document
    try {
      const updateResult = await Order.updateOne(
        { orderId: rzpOrder.receipt },
        { "payment.razorpayOrderId": rzpOrder.id },
      );
      console.log(
        `Associated Razorpay order ID ${rzpOrder.id} with local order ${rzpOrder.receipt}. Modified count: ${updateResult.modifiedCount}`,
      );
    } catch (dbErr) {
      console.error("Failed to associate razorpayOrderId with local order:", dbErr);
    }

    return NextResponse.json({
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      receipt: rzpOrder.receipt,
    });
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment order" },
      { status: 500 },
    );
  }
}
