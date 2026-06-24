import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Wishlist from "@/lib/models/Wishlist";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database offline" }, { status: 500 });
    }

    const wishlist = await Wishlist.findOne({ userId: session.user.id }).lean();
    const products = wishlist?.products?.map((p: any) => p.toString()) || [];

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Wishlist GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch wishlist" },
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

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database offline" }, { status: 500 });
    }

    const body = await request.json();
    const { productId, productIds } = body;

    let wishlist = await Wishlist.findOne({ userId: session.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: session.user.id, products: [] });
    }

    let currentProducts = wishlist.products.map((p: any) => p.toString());

    if (Array.isArray(productIds)) {
      // Merge strategy: union of both lists (local storage wishlist + DB wishlist)
      const union = Array.from(new Set([...currentProducts, ...productIds]));
      wishlist.products = union
        .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
        .map((id: string) => new mongoose.Types.ObjectId(id));
    } else if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      if (currentProducts.includes(productId)) {
        // Toggle: remove if exists
        wishlist.products = wishlist.products.filter((p: any) => p.toString() !== productId);
      } else {
        // Toggle: add if not exists
        wishlist.products.push(new mongoose.Types.ObjectId(productId));
      }
    } else {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await wishlist.save();
    const updatedProducts = wishlist.products.map((p: any) => p.toString());

    return NextResponse.json(updatedProducts);
  } catch (error: any) {
    console.error("Wishlist POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update wishlist" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
