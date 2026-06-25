import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import SubOrder from "@/lib/models/SubOrder";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import VendorProfile from "@/lib/models/VendorProfile";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const vendorId = session.user.id;

    // 1. Fetch vendor profile & wallet balance
    const vendorUser = await User.findById(vendorId).select("walletBalance").lean();
    const profile = await VendorProfile.findOne({ userId: vendorId })
      .select("rating kycStatus verificationStatus bankVerified gstinVerified panVerified")
      .lean();

    const walletBalance = vendorUser?.walletBalance ?? 0;
    const rating = profile?.rating?.average ?? 4.5;
    const kycStatus = profile?.kycStatus ?? "pending";
    const verificationStatus = profile?.verificationStatus ?? "pending";

    // 2. Count products
    const productsCount = await Product.countDocuments({ vendorId });

    // 3. Count total orders (sub-orders assigned)
    const ordersCount = await SubOrder.countDocuments({ vendorId });

    // 4. Sum revenue (delivered sub-orders)
    let revenue = 0;
    const deliveredSubOrders = await SubOrder.find({ vendorId, status: "DELIVERED" })
      .select("pricing.vendorPayout")
      .lean();
    revenue = deliveredSubOrders.reduce((sum, o) => sum + (o.pricing?.vendorPayout ?? 0), 0);

    // 5. Fetch latest 5 sub-orders
    const rawSubOrders = await SubOrder.find({ vendorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const latestSubOrders = rawSubOrders.map((so: any) => ({
      id: so._id.toString(),
      subOrderId: so.subOrderId,
      number: so.subOrderId,
      parentOrderSeqId: so.parentOrderSeqId || "—",
      createdAt: so.createdAt,
      status: so.status,
      total: so.pricing?.total ?? 0,
      payout: so.pricing?.vendorPayout ?? 0,
    }));

    // 6. Split status queues
    const placedQueue = await SubOrder.countDocuments({ vendorId, status: "PLACED" });
    const readyToShipQueue = await SubOrder.countDocuments({ vendorId, status: { $in: ["CONFIRMED", "PACKED"] } });
    const inTransitQueue = await SubOrder.countDocuments({ vendorId, status: { $in: ["SHIPPED", "OUT_FOR_DELIVERY"] } });

    return NextResponse.json({
      revenue,
      productsCount,
      ordersCount,
      rating,
      payoutsPending: walletBalance,
      latestOrders: latestSubOrders,
      placedQueue,
      readyToShipQueue,
      inTransitQueue,
      kycStatus,
      verificationStatus,
      bankVerified: profile?.bankVerified ?? false,
      gstinVerified: profile?.gstinVerified ?? false,
      panVerified: profile?.panVerified ?? false,
    });
  } catch (error: any) {
    console.error("Vendor dashboard API failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
