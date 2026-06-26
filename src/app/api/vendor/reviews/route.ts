import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Review from "@/lib/models/Review";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized. Vendor role required." }, { status: 401 });
    }

    await connectToDatabase();

    // 1. Fetch all product IDs owned by this vendor
    const vendorProducts = await Product.find({ vendorId: session.user.id }).select("_id").lean();
    const productIds = vendorProducts.map((p) => p._id);

    // 2. Fetch reviews on those products
    const reviews = await Review.find({ productId: { $in: productIds } })
      .populate({ path: "userId", model: User, select: "name email avatar" })
      .populate({ path: "productId", model: Product, select: "name slug images" })
      .sort({ createdAt: -1 })
      .lean();

    const formattedReviews = reviews.map((r: any) => ({
      id: r._id.toString(),
      productId: r.productId?._id?.toString() || "",
      productName: r.productId?.name || "Deleted Product",
      productSlug: r.productId?.slug || "",
      productImage: r.productId?.images?.[0] || "",
      userName: r.userId?.name || "Customer",
      userEmail: r.userId?.email || "",
      rating: r.rating,
      title: r.title || "",
      comment: r.comment || "",
      images: r.images || [],
      isApproved: r.isApproved,
      isVerifiedPurchase: r.isVerifiedPurchase,
      helpfulVotes: r.helpfulVotes || 0,
      vendorReply: r.vendorReply || null,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedReviews);
  } catch (error: any) {
    console.error("Failed to fetch vendor reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized. Vendor role required." }, { status: 401 });
    }

    const { reviewId, message } = await request.json();
    if (!reviewId || !message?.trim()) {
      return NextResponse.json({ error: "Missing reviewId or message" }, { status: 400 });
    }

    await connectToDatabase();

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify this product belongs to this vendor
    const product = await Product.findById(review.productId).select("vendorId").lean();
    if (!product || product.vendorId?.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized. Product does not belong to this vendor." }, { status: 403 });
    }

    // Save vendor reply
    review.vendorReply = {
      message: message.trim(),
      repliedAt: new Date(),
    };

    await review.save();

    return NextResponse.json({
      success: true,
      message: "Reply saved successfully!",
      review,
    });
  } catch (error: any) {
    console.error("Failed to save vendor review reply:", error);
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
