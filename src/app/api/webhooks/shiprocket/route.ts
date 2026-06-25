import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ShippingOrder from "@/lib/models/ShippingOrder";
import { transitionSubOrderStatus } from "@/lib/order-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { awb, current_status, current_status_id, current_timestamp, location, activity } = body;

    if (!awb) {
      return NextResponse.json({ error: "Missing AWB code" }, { status: 400 });
    }

    console.log(`[Shiprocket Webhook] Received status update for AWB: ${awb}, status: ${current_status}`);

    await connectToDatabase();

    // Find the shipping order
    const shippingOrder = await ShippingOrder.findOne({ awbNumber: awb });
    if (!shippingOrder) {
      return NextResponse.json({ message: "AWB not tracked in our database" }, { status: 200 });
    }

    // Map Shiprocket status to our local status
    const rStatus = (current_status || "").toLowerCase();
    let localStatus: 'pending' | 'manifested' | 'pickup_scheduled' | 'shipped' | 'delivered' | 'returned' | 'cancelled' = "pending";
    let subOrderStatus: string | null = null;

    if (rStatus.includes("delivered")) {
      localStatus = "delivered";
      subOrderStatus = "DELIVERED";
    } else if (rStatus.includes("shipped") || rStatus.includes("in transit") || rStatus.includes("out for delivery")) {
      localStatus = "shipped";
      subOrderStatus = "SHIPPED";
    } else if (rStatus.includes("rto") || rStatus.includes("return") || rStatus.includes("undelivered")) {
      localStatus = "returned";
      subOrderStatus = "RETURNED";
    } else if (rStatus.includes("cancel")) {
      localStatus = "cancelled";
      subOrderStatus = "CANCELLED";
    } else if (rStatus.includes("pickup") || rStatus.includes("schedule")) {
      localStatus = "pickup_scheduled";
    } else if (rStatus.includes("manifest")) {
      localStatus = "manifested";
    }

    // Append to scan history
    shippingOrder.status = localStatus;
    shippingOrder.history.push({
      status: localStatus,
      detail: activity || `Shiprocket Webhook: ${current_status}`,
      location: location || "",
      timestamp: current_timestamp ? new Date(current_timestamp) : new Date(),
    });

    await shippingOrder.save();

    // Propagate transition to SubOrder
    if (subOrderStatus) {
      try {
        await transitionSubOrderStatus(
          shippingOrder.subOrderId,
          subOrderStatus,
          {},
          "SHIPROCKET_WEBHOOK",
          `Status sync via Shiprocket Webhook: ${current_status}`
        );
      } catch (err: any) {
        console.error(`Failed to propagate status change to sub-order ${shippingOrder.subOrderId}:`, err);
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("Failed to process Shiprocket webhook:", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
