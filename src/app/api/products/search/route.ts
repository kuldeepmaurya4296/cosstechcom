import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Category";
import { products as fallbackProducts } from "@/data/products";
import { ensureDbReady, normalizeProduct } from "@/lib/db-utils";
import { cachedJson } from "@/lib/api-cache";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    const { db, isReady } = await ensureDbReady();
    if (!isReady) {
      console.warn("Using local mock products fallback for search (database offline).");
      const normalizedQuery = query.toLowerCase().trim();
      const results = fallbackProducts
        .map((p) => normalizeProduct(p))
        .filter(
          (p: any) =>
            p.name?.toLowerCase().includes(normalizedQuery) ||
            p.description?.toLowerCase().includes(normalizedQuery) ||
            p.brand?.toLowerCase().includes(normalizedQuery) ||
            p.category?.toLowerCase().includes(normalizedQuery),
        );
      return NextResponse.json(results);
    }

    function escapeRegExp(str: string) {
      return str.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
    }

    // Search query matches name, brand, description, tags, category slug
    const regex = new RegExp(escapeRegExp(query), "i");

    // Fetch categories matching the query to also search by category names/slugs
    const matchingCategories = await Category.find({
      $or: [{ name: regex }, { slug: regex }],
    })
      .select("_id")
      .lean();
    const categoryIds = matchingCategories.map((c) => c._id);

    // Fetch brands matching the query
    const Brand = (await import("@/lib/models/Brand")).default;
    const matchingBrands = await Brand.find({ name: regex }).select("_id").lean();
    const brandIds = matchingBrands.map((b: any) => b._id);

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: regex },
        { description: regex },
        { tags: regex },
        { category: { $in: categoryIds } },
        ...(brandIds.length > 0 ? [{ brand: { $in: brandIds } }] : []),
      ],
    })
      .limit(16)
      .populate({ path: "category", model: Category })
      .populate({ path: "brand", model: Brand })
      .lean();

    const normalized = products.map((p: any) => normalizeProduct(p));

    // Short CDN cache — popular search terms repeat; 30s keeps it snappy.
    return cachedJson(normalized, 30, 120);
  } catch (error: any) {
    console.error("Search API failed:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during search query resolution" },
      { status: 500 },
    );
  }
}
export const dynamic = "force-dynamic";
