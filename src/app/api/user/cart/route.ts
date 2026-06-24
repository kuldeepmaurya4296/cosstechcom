import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Cart from "@/lib/models/Cart";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User"; // Ensure User model is registered
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const cart = await Cart.findOne({ userId: session.user.id }).lean();

    if (!cart) {
      return NextResponse.json({ items: [], grouped: [] });
    }

    // Group items by vendor
    const grouped: Record<string, { vendorId: string; vendorName: string; items: any[] }> = {};
    for (const item of cart.items) {
      const vId = item.vendorId.toString();
      if (!grouped[vId]) {
        grouped[vId] = {
          vendorId: vId,
          vendorName: item.vendorName || "Unknown Seller",
          items: [],
        };
      }
      grouped[vId].items.push(item);
    }

    return NextResponse.json({
      ...cart,
      grouped: Object.values(grouped),
    });
  } catch (error: any) {
    console.error("Failed to fetch user cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { lines } = body;

    if (!Array.isArray(lines)) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    // Resolve products and their vendors from DB
    const productIds = lines.map((l: any) => l.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate("vendorId", "name storeName")
      .lean();
    const productById = new Map(products.map((p: any) => [p._id.toString(), p]));

    const items = lines.map((l: any) => {
      const prod = productById.get(l.productId.toString());
      if (!prod) {
        throw new Error(`Product not found in database: ${l.name || l.productId}`);
      }
      const vendorUser = prod.vendorId as any;
      return {
        productId: l.productId,
        name: prod.name,
        price: prod.salePrice,
        image: l.image || (prod.images?.[0]?.url),
        size: l.size,
        color: l.color,
        quantity: l.quantity,
        slug: prod.slug,
        vendorId: vendorUser._id || vendorUser,
        vendorName: vendorUser.storeName || vendorUser.name || "Unknown Seller",
      };
    });

    // Find and update or create cart. Reset emailSent flag.
    const cart = await Cart.findOneAndUpdate(
      { userId: session.user.id },
      {
        items,
        emailSent: false,
      },
      { upsert: true, new: true },
    );

    // Group items by vendor for the response
    const grouped: Record<string, { vendorId: string; vendorName: string; items: any[] }> = {};
    for (const item of cart.items) {
      const vId = item.vendorId.toString();
      if (!grouped[vId]) {
        grouped[vId] = {
          vendorId: vId,
          vendorName: item.vendorName || "Unknown Seller",
          items: [],
        };
      }
      grouped[vId].items.push(item);
    }

    return NextResponse.json({
      success: true,
      cart: {
        ...cart.toObject(),
        grouped: Object.values(grouped),
      },
    });
  } catch (error: any) {
    console.error("Failed to sync cart:", error);
    return NextResponse.json({ error: error.message || "Failed to sync cart" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
