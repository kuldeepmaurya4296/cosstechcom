import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import SubOrder from "@/lib/models/SubOrder";
import Order from "@/lib/models/Order";
import VendorProfile from "@/lib/models/VendorProfile";
import ShippingOrder from "@/lib/models/ShippingOrder";
import { createShipmentOrder, generateAwb, requestPickup, getTrackingDetails } from "@/lib/shipping";
import { transitionSubOrderStatus } from "@/lib/order-utils";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized. Vendor credentials required." }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { subOrderId } = body;

    if (!subOrderId) {
      return NextResponse.json({ error: "Missing subOrderId" }, { status: 400 });
    }

    const subOrder = await SubOrder.findById(subOrderId);
    if (!subOrder) {
      return NextResponse.json({ error: "Sub-order not found" }, { status: 404 });
    }

    if (subOrder.vendorId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to this sub-order" }, { status: 403 });
    }

    if (subOrder.status !== "PLACED" && subOrder.status !== "CONFIRMED" && subOrder.status !== "PACKED") {
      return NextResponse.json(
        { error: `Cannot ship a sub-order in status: ${subOrder.status}` },
        { status: 400 }
      );
    }

    const vendorProfile = await VendorProfile.findOne({ userId: session.user.id });
    if (!vendorProfile) {
      return NextResponse.json({ error: "Vendor profile not found. Please complete KYC and profile." }, { status: 400 });
    }

    const parentOrder = await Order.findById(subOrder.parentOrderId);
    if (!parentOrder) {
      return NextResponse.json({ error: "Parent order not found" }, { status: 404 });
    }

    // 1. Create Shipment Order
    const shipOrderRes = await createShipmentOrder(subOrder, vendorProfile, parentOrder.shippingAddress);
    if (!shipOrderRes.success || !shipOrderRes.shipmentId) {
      return NextResponse.json({ error: shipOrderRes.error || "Failed to create shipment order" }, { status: 500 });
    }

    const shipmentId = shipOrderRes.shipmentId;

    // 2. Generate AWB
    const awbRes = await generateAwb(shipmentId);
    if (!awbRes.success || !awbRes.awbNumber) {
      return NextResponse.json({ error: awbRes.error || "Failed to generate AWB code" }, { status: 500 });
    }

    const awbNumber = awbRes.awbNumber;
    const carrier = awbRes.courierName || "Shiprocket Partner";

    // 3. Request Pickup
    const pickupRes = await requestPickup(shipmentId);
    let estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    if (pickupRes.success && pickupRes.pickupDate) {
      estimatedDelivery = new Date(new Date(pickupRes.pickupDate).getTime() + 4 * 24 * 60 * 60 * 1000);
    }

    // 4. Create ShippingOrder record
    const shippingOrder = await ShippingOrder.create({
      subOrderId: subOrder._id,
      shipmentId,
      awbNumber,
      carrier,
      status: "pickup_scheduled",
      trackingUrl: `https://track.shiprocket.in/tracking/${awbNumber}`,
      estimatedDelivery,
      history: [
        {
          status: "manifested",
          detail: "Shipment details uploaded to courier service.",
          timestamp: new Date(),
        },
        {
          status: "pickup_scheduled",
          detail: `Courier pickup scheduled. AWB: ${awbNumber}`,
          timestamp: new Date(),
        },
      ],
    });

    // 5. Update SubOrder
    subOrder.shippingOrderId = shippingOrder._id as any;
    subOrder.awbNumber = awbNumber;
    subOrder.shipping = {
      courier: carrier,
      trackingNumber: awbNumber,
      trackingUrl: `https://track.shiprocket.in/tracking/${awbNumber}`,
    };
    await subOrder.save();

    // 6. Transition SubOrder to SHIPPED status
    await transitionSubOrderStatus(
      subOrder._id,
      "SHIPPED",
      {},
      session.user.id,
      `Courier booked via Shiprocket. Courier: ${carrier}, AWB: ${awbNumber}`
    );

    return NextResponse.json({
      success: true,
      message: "Shipment booked successfully!",
      shippingOrder,
      subOrder,
    });
  } catch (error: any) {
    console.error("Vendor shipping creation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to create shipment" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subOrderId = searchParams.get("subOrderId");

    if (!subOrderId) {
      return NextResponse.json({ error: "subOrderId query parameter required" }, { status: 400 });
    }

    await connectToDatabase();

    const shippingOrder = await ShippingOrder.findOne({ subOrderId });
    if (!shippingOrder) {
      return NextResponse.json({ error: "No shipping details found for this order" }, { status: 404 });
    }

    // Attempt to pull latest live tracking updates if we have an AWB
    if (shippingOrder.awbNumber) {
      const tracking = await getTrackingDetails(shippingOrder.awbNumber);
      if (tracking.success && tracking.status) {
        // Sync status if different
        let localStatus: any = "pending";
        const rStatus = tracking.status.toLowerCase();
        if (rStatus.includes("delivered")) localStatus = "delivered";
        else if (rStatus.includes("shipped") || rStatus.includes("in transit")) localStatus = "shipped";
        else if (rStatus.includes("cancelled")) localStatus = "cancelled";
        else if (rStatus.includes("return")) localStatus = "returned";
        else if (rStatus.includes("manifest")) localStatus = "manifested";
        else if (rStatus.includes("pickup")) localStatus = "pickup_scheduled";

        if (localStatus !== shippingOrder.status) {
          shippingOrder.status = localStatus;
          shippingOrder.history.push({
            status: localStatus,
            detail: tracking.activity || `Shipment status updated to ${tracking.status}`,
            timestamp: new Date(),
          });
          await shippingOrder.save();

          // If delivered or returned, transition the sub-order too!
          if (localStatus === "delivered") {
            await transitionSubOrderStatus(subOrderId, "DELIVERED", {}, "SYSTEM_SHIPPING", "Delivered via Shiprocket tracking sync.");
          } else if (localStatus === "returned") {
            await transitionSubOrderStatus(subOrderId, "RETURNED", {}, "SYSTEM_SHIPPING", "Returned via Shiprocket tracking sync.");
          }
        }
      }
    }

    return NextResponse.json(shippingOrder);
  } catch (error: any) {
    console.error("Failed to fetch shipping tracking info:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch shipping tracking info" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
