import mongoose from "mongoose";
import { connectToDatabase } from "./db";

export async function ensureDbReady() {
  const db = await connectToDatabase();
  const isReady = db && mongoose.connection.readyState === 1;
  return { db, isReady };
}

// Helper to safely convert any Mongoose ObjectId / BSON value to a plain string
function toStr(val: any): string | undefined {
  if (val == null) return undefined;
  if (typeof val === "string") return val;
  if (typeof val.toString === "function") return val.toString();
  return undefined;
}

export function normalizeProduct(p: any) {
  // Resolve brand name — handle populated doc, raw ObjectId, or plain string
  let brandName: string;
  if (p.brand && typeof p.brand === "object" && "name" in p.brand) {
    brandName = p.brand.name;
  } else if (typeof p.brand === "string") {
    brandName = p.brand;
  } else {
    brandName =
      p.vendorId === "v1"
        ? "Lakhani"
        : p.vendorId === "v2"
          ? "Touch"
          : p.vendorId === "v3"
            ? "Paragon"
            : p.vendorId === "v4"
              ? "Goldstar"
              : "CosstechCom";
  }

  // Resolve brandId — only keep it as a string
  let brandId: string | undefined;
  if (p.brand && typeof p.brand === "object" && p.brand._id) {
    brandId = p.brand._id.toString();
  } else if (typeof p.brand === "string") {
    brandId = p.brand;
  }

  // Resolve category slug safely
  const category =
    p.category && typeof p.category === "object" && p.category.slug
      ? p.category.slug
      : typeof p.category === "string"
        ? p.category
        : "shoes";

  return {
    id: p._id ? p._id.toString() : p.id || "",
    slug: p.slug || "",
    name: p.name || "",
    category,
    brand: brandName,
    brandId,
    vendorId: p.vendorId && typeof p.vendorId === "object" && p.vendorId._id ? p.vendorId._id.toString() : toStr(p.vendorId),
    vendorName: p.vendorId && typeof p.vendorId === "object" ? p.vendorId.name : undefined,
    vendorStoreName: p.vendorId && typeof p.vendorId === "object" ? p.vendorId.storeName : undefined,
    specifications: p.specifications
      ? p.specifications.map((spec: any) => ({
          key: String(spec.key || ""),
          value: String(spec.value || ""),
        }))
      : [],
    price: p.salePrice !== undefined ? Number(p.salePrice) : Number(p.price || 0),
    compareAt:
      p.salePrice !== undefined
        ? Number(p.price)
        : p.compareAt !== undefined
          ? Number(p.compareAt)
          : undefined,
    variants: p.variants
      ? p.variants.map((v: any) => ({
          size: v.size,
          color: v.color || "",
          colorHex: v.colorHex || "",
          stock: Number(v.stock || 0),
          sku: v.sku || "",
          images: v.images
            ? v.images.map((img: any) => ({
                url: String(img.url || ""),
                public_id: String(img.public_id || ""),
              }))
            : [],
        }))
      : [],
    image:
      p.images && p.images[0]
        ? String(p.images[0].url)
        : p.image || "/assets/product-placeholder.jpg",
    gallery: p.images ? p.images.map((img: any) => String(img.url)) : p.gallery || [],
    description: p.description || "",
    details:
      p.tags && p.tags.length > 0
        ? p.tags.map(String)
        : Array.isArray(p.details)
          ? p.details.map(String)
          : ["Premium craftsmanship", "Durability assured"],
    colors: Array.from(
      new Set(p.variants ? p.variants.map((v: any) => String(v.color || "")) : p.colors || []),
    ) as string[],
    sizes: Array.from(
      new Set(p.variants ? p.variants.map((v: any) => v.size ? String(v.size) : "") : p.sizes || []),
    ).filter(Boolean) as string[],
    stock: p.variants
      ? p.variants.reduce((acc: number, v: any) => acc + Number(v.stock || 0), 0)
      : p.stock !== undefined
        ? Number(p.stock)
        : 0,
    rating: p.rating
      ? typeof p.rating === "number"
        ? p.rating
        : Number(p.rating.average || 4.5)
      : 4.5,
    reviewsCount: p.rating
      ? typeof p.rating === "number"
        ? p.reviewsCount || 0
        : Number(p.rating.count || 0)
      : p.reviewsCount || 0,
    badge: (p.isFeatured ? "bestseller" : p.isNewArrival ? "new" : p.badge) as
      | "new"
      | "bestseller"
      | "sale"
      | undefined,
    createdAt: p.createdAt
      ? p.createdAt instanceof Date
        ? p.createdAt.toISOString().split("T")[0]
        : String(p.createdAt)
      : "2025-06-08",
  };
}

export async function updateProductRating(productId: string) {
  const Review = mongoose.models.Review || (await import("./models/Review")).default;
  const Product = mongoose.models.Product || (await import("./models/Product")).default;

  const allReviews = await Review.find({ productId, isApproved: true });

  // Group reviews by userId
  const reviewsByUser: Record<string, any[]> = {};
  allReviews.forEach((r) => {
    const uId = r.userId.toString();
    if (!reviewsByUser[uId]) {
      reviewsByUser[uId] = [];
    }
    reviewsByUser[uId].push(r);
  });

  // Select only the review with the highest rating for each user
  const selectedReviews = Object.values(reviewsByUser).map((userReviews) => {
    return userReviews.reduce((highest, current) => {
      return current.rating > highest.rating ? current : highest;
    });
  });

  const count = selectedReviews.length;
  const average = count > 0 ? selectedReviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  await Product.findByIdAndUpdate(productId, {
    "rating.average": parseFloat(average.toFixed(1)),
    "rating.count": count,
  });
}

export async function cleanupExpiredPendingOrders() {
  const Order = mongoose.models.Order || (await import("./models/Order")).default;
  const Product = mongoose.models.Product || (await import("./models/Product")).default;

  try {
    const expiryTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes expiry window

    const expiredOrders = await Order.find({
      status: "PLACED",
      "payment.method": { $ne: "COD" },
      "payment.status": "PENDING",
      createdAt: { $lt: expiryTime },
    });

    if (expiredOrders.length === 0) return;

    console.log(
      `[Passive Cleanup] Found ${expiredOrders.length} expired pending orders. Clean-up started...`,
    );

    for (const order of expiredOrders) {
      console.log(`[Passive Cleanup] Auto-cancelling expired order ${order.orderId}`);

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
        note: "Payment window expired. Order cancelled automatically.",
      });

      await order.save();
    }
    console.log(`[Passive Cleanup] Successfully processed ${expiredOrders.length} cancellations.`);
  } catch (err) {
    console.error("[Passive Cleanup] Error during pending orders cleanup:", err);
  }
}
