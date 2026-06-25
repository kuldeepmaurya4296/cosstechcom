import { NextResponse } from "next/server";
import { ensureDbReady, normalizeProduct } from "@/lib/db-utils";
import { cachedJson } from "@/lib/api-cache";
import { searchProducts } from "@/lib/search";
import { products as fallbackProducts } from "@/data/products";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const categorySlug = searchParams.get("category") || undefined;
    const brandName = searchParams.get("brand") || undefined;
    const minPriceStr = searchParams.get("minPrice");
    const maxPriceStr = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sort") || undefined; // price_asc, price_desc, rating, newest
    const limitStr = searchParams.get("limit");
    const skipStr = searchParams.get("skip");

    if (!query.trim() && !categorySlug && !brandName) {
      return NextResponse.json([]);
    }

    const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined;
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;
    const limit = limitStr ? parseInt(limitStr) : 16;
    const skip = skipStr ? parseInt(skipStr) : 0;

    const { isReady } = await ensureDbReady();
    if (!isReady) {
      console.warn("Using local mock products fallback for search (database offline).");
      const normalizedQuery = query.toLowerCase().trim();
      const results = fallbackProducts
        .map((p) => normalizeProduct(p))
        .filter(
          (p: any) =>
            !normalizedQuery ||
            p.name?.toLowerCase().includes(normalizedQuery) ||
            p.description?.toLowerCase().includes(normalizedQuery) ||
            p.brand?.toLowerCase().includes(normalizedQuery) ||
            p.category?.toLowerCase().includes(normalizedQuery),
        );
      return NextResponse.json(results.slice(skip, skip + limit));
    }

    // Call our unified search utility supporting Atlas Search and Regex fallback
    const { products } = await searchProducts({
      query,
      categorySlug,
      brandName,
      minPrice,
      maxPrice,
      sortBy: sortBy as any,
      limit,
      skip,
    });

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
