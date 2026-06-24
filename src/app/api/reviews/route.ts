import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import mongoose from "mongoose";
import Review from "@/lib/models/Review";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";
import Order from "@/lib/models/Order";
import { updateProductRating } from "@/lib/db-utils";

function addReviewNumbers(reviews: any[]) {
  // Sort copies chronologically (oldest first)
  const sorted = [...reviews].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const userReviewCounts: Record<string, number> = {};
  const reviewNumbers: Record<string, number> = {};

  sorted.forEach((r) => {
    const uId =
      r.userId && typeof r.userId === "object" && "_id" in r.userId
        ? (r.userId as any)._id.toString()
        : r.userId?.toString() || "anonymous";

    if (!userReviewCounts[uId]) {
      userReviewCounts[uId] = 0;
    }
    userReviewCounts[uId]++;
    reviewNumbers[r._id.toString()] = userReviewCounts[uId];
  });

  return reviews.map((r) => {
    const obj = r.toObject ? r.toObject() : r;
    return {
      ...obj,
      id: r._id.toString(),
      reviewNumber: reviewNumbers[r._id.toString()] || 1,
    };
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const approvedOnly = searchParams.get("approvedOnly") !== "false";

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const session = await auth();
    const isAdmin = session?.user && (session.user as any).role === "admin";

    // If fetching admin list (no product ID or explicitly admin request)
    if (!productId) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized. Admin role required to fetch all reviews." },
          { status: 401 },
        );
      }

      // Fetch all reviews for admin dashboard
      const filter: any = {};
      if (searchParams.has("isApproved")) {
        filter.isApproved = searchParams.get("isApproved") === "true";
      }

      const reviews = await Review.find(filter)
        .populate({ path: "userId", model: User, select: "name email avatar" })
        .populate({ path: "productId", model: Product, select: "name slug images" })
        .sort({ createdAt: -1 });

      return NextResponse.json(addReviewNumbers(reviews));
    }

    // Normal product details reviews fetch
    const query: any = { productId };
    if (approvedOnly) {
      query.isApproved = true;
    }

    const reviews = await Review.find(query)
      .populate({ path: "userId", model: User, select: "name avatar" })
      .sort({ createdAt: -1 });

    return NextResponse.json(addReviewNumbers(reviews));
  } catch (error: any) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, rating, title, comment, body, images } = await request.json();

    if (!productId || !rating) {
      return NextResponse.json(
        { error: "productId and rating are required fields" },
        { status: 400 },
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    // Update all existing reviews by this user for this product to this new rating
    await Review.updateMany({ productId, userId: session.user.id }, { rating });

    // Check if user has purchased the item
    const deliveredOrder = await Order.findOne({
      userId: session.user.id,
      "items.productId": productId,
      status: "DELIVERED",
    });

    const isVerifiedPurchase = !!deliveredOrder;

    // Create review entry
    const newReview = await Review.create({
      productId,
      userId: session.user.id,
      rating,
      title: title || "",
      comment: comment || body || "",
      images: images || [],
      isApproved: true, // Auto-approved
      isVerifiedPurchase,
    });

    // Update product overall ratings immediately since it is auto-approved!
    await updateProductRating(productId);

    return NextResponse.json({ success: true, review: newReview });
  } catch (error: any) {
    console.error("Failed to submit review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit review" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    const isAdmin = session?.user && (session.user as any).role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 401 });
    }

    const { reviewId, rating, title, comment } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (rating !== undefined) {
      // Update all reviews of the same user for the same product to this rating
      await Review.updateMany({ productId: review.productId, userId: review.userId }, { rating });
      review.rating = rating;
    }
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Update product overall ratings (count and average)
    await updateProductRating(review.productId.toString());

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error("Failed to update review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update review" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const isAdmin = (session.user as any).role === "admin";
    const isOwner = review.userId.toString() === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Unauthorized. You do not own this review." },
        { status: 403 },
      );
    }

    const productId = review.productId.toString();
    await Review.findByIdAndDelete(reviewId);

    // Recalculate ratings
    await updateProductRating(productId);

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete review" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulVotes: 1 } },
      { new: true },
    );

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, helpfulVotes: review.helpfulVotes || 0 });
  } catch (error: any) {
    console.error("Failed to update helpful votes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update helpful votes" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
