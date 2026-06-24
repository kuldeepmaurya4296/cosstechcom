import { connectToDatabase as dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import Category from "@/lib/models/Category";
import Product from "@/lib/models/Product";
import Brand from "@/lib/models/Brand";
import AnalyticsClient from "./components/AnalyticsClient";
import { cleanupExpiredPendingOrders } from "@/lib/db-utils";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await dbConnect();

  // Passively cleanup any expired pending orders
  await cleanupExpiredPendingOrders();

  // 1. Fetch raw data from DB, excluding unpaid pending orders
  const rawOrders = await Order.find({
    $or: [{ "payment.method": "COD" }, { "payment.status": { $ne: "PENDING" } }],
  })
    .sort({ createdAt: 1 })
    .lean();
  const rawUsers = await User.find({ role: "customer" }).select("name email createdAt").lean();
  const rawCategories = await Category.find({}).select("name").lean();
  const rawBrands = await Brand.find({}).select("name").lean();
  const rawProducts = await Product.find({})
    .select("name brand category gender salePrice price variants images")
    .lean();

  // 2. Safe serialization to prevent Next.js RSC-to-Client component warnings
  const orders = rawOrders.map((o: any) => ({
    _id: o._id.toString(),
    orderId: o.orderId,
    userId: o.userId?.toString() || "",
    status: o.status,
    createdAt:
      o.createdAt instanceof Date ? o.createdAt.toISOString() : new Date(o.createdAt).toISOString(),
    updatedAt:
      o.updatedAt instanceof Date ? o.updatedAt.toISOString() : new Date(o.updatedAt).toISOString(),
    pricing: {
      subtotal: o.pricing?.subtotal || 0,
      shipping: o.pricing?.shipping || 0,
      couponDiscount: o.pricing?.couponDiscount || 0,
      total: o.pricing?.total || 0,
    },
    payment: {
      method: o.payment?.method || "COD",
      status: o.payment?.status || "PENDING",
    },
    items: (o.items || []).map((item: any) => ({
      productId: item.productId?.toString() || "",
      name: item.name || "Unknown Item",
      image: item.image || "/assets/product-placeholder.jpg",
      size: item.size || 0,
      color: item.color || "",
      price: item.price || 0,
      qty: item.qty || item.quantity || 1,
    })),
    shippingAddress: {
      fullName: o.shippingAddress?.fullName || "",
      phone: o.shippingAddress?.phone || "",
      line1: o.shippingAddress?.line1 || "",
      line2: o.shippingAddress?.line2 || "",
      city: o.shippingAddress?.city || "",
      state: o.shippingAddress?.state || "",
      pin: o.shippingAddress?.pin || "",
    },
    coupon: o.coupon
      ? {
          code: o.coupon.code || "",
          discountAmount: o.coupon.discountAmount || 0,
        }
      : undefined,
    shipping: o.shipping
      ? {
          courier: o.shipping.courier || "",
          trackingNumber: o.shipping.trackingNumber || "",
        }
      : undefined,
    refundDetails: o.refundDetails
      ? {
          preference: o.refundDetails.preference || "",
          upiId: o.refundDetails.upiId || "",
          bankDetails: o.refundDetails.bankDetails
            ? {
                accountHolderName: o.refundDetails.bankDetails.accountHolderName || "",
                bankName: o.refundDetails.bankDetails.bankName || "",
                accountNumber: o.refundDetails.bankDetails.accountNumber || "",
                ifscCode: o.refundDetails.bankDetails.ifscCode || "",
              }
            : undefined,
          method: o.refundDetails.method || "",
          transactionId: o.refundDetails.transactionId || "",
          refundedAt:
            o.refundDetails.refundedAt instanceof Date
              ? o.refundDetails.refundedAt.toISOString()
              : o.refundDetails.refundedAt
                ? new Date(o.refundDetails.refundedAt).toISOString()
                : undefined,
        }
      : undefined,
  }));

  const products = rawProducts.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    brand: p.brand?.toString() || "",
    category: p.category?.toString() || "",
    gender: p.gender,
    price: p.price,
    salePrice: p.salePrice,
    stock: p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0,
    image: p.images?.[0]?.url || "/assets/product-placeholder.jpg",
  }));

  const brands = rawBrands.map((b: any) => ({
    _id: b._id.toString(),
    name: b.name,
  }));

  const categories = rawCategories.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
  }));

  const customers = rawUsers.map((u: any) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    createdAt:
      u.createdAt instanceof Date ? u.createdAt.toISOString() : new Date(u.createdAt).toISOString(),
  }));

  return (
    <AnalyticsClient
      orders={orders}
      products={products}
      brands={brands}
      categories={categories}
      customers={customers}
    />
  );
}
