import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Category";
import Brand from "@/lib/models/Brand";

import { ensureDbReady, normalizeProduct } from "@/lib/db-utils";
import { cachedJson } from "@/lib/api-cache";

export async function GET(request: Request, { params }: { params: Promise<any> }) {
  try {
    const { slug } = await params;

    const { db, isReady } = await ensureDbReady();
    if (!isReady) {
      throw new Error("Database offline");
    }

    // Try finding by slug first, then by ObjectId id
    let product = await Product.findOne({ slug, isActive: true })
      .populate({ path: "category", model: Category })
      .populate({ path: "brand", model: Brand })
      .lean();
    if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findOne({ _id: slug, isActive: true })
        .populate({ path: "category", model: Category })
        .populate({ path: "brand", model: Brand })
        .lean();
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { applyFlashSaleToSingleProduct } = await import("@/lib/flash-sale-utils");
    const norm = normalizeProduct(product);
    const withFlashSale = await applyFlashSaleToSingleProduct(norm);

    // Detail pages change rarely — cache 5min on CDN, 30min stale-while-revalidate.
    return cachedJson(withFlashSale, 300, 1800);
  } catch (error: any) {
    console.error("Failed to fetch product details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch product details" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
