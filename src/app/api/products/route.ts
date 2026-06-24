import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Category";
import Brand from "@/lib/models/Brand";
import { ensureDbReady, normalizeProduct } from "@/lib/db-utils";
import { applyFlashSales } from "@/lib/flash-sale-utils";
import { cachedJson } from "@/lib/api-cache";

function escapeRegExp(string: string) {
  return string.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const brand = searchParams.get("brand");
    const occasion = searchParams.get("occasion");
    const gender = searchParams.get("gender");
    const searchQuery = searchParams.get("search");
    const sort = searchParams.get("sort") || "new";

    const { db, isReady } = await ensureDbReady();
    if (!isReady) {
      throw new Error("Database offline");
    }

    let query: any = { isActive: true };

    // 1. Category filter
    if (categorySlug && categorySlug !== "all") {
      const categoryDoc = await Category.findOne({ slug: categorySlug }).select("_id").lean();
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        return NextResponse.json([]); // Category not found
      }
    }

    // 2. Brand filter
    if (brand) {
      const brandDoc = await Brand.findOne({ name: new RegExp(`^${escapeRegExp(brand)}$`, "i") })
        .select("_id")
        .lean();
      if (brandDoc) {
        query.brand = brandDoc._id;
      } else {
        query.brand = new mongoose.Types.ObjectId(); // force empty results
      }
    }

    // 3. Occasion filter
    if (occasion) {
      query.occasion = occasion;
    }

    // 4. Gender filter
    if (gender) {
      query.gender = gender;
    }

    // 5. Search query matching name, description, brand, tags
    if (searchQuery) {
      const regex = new RegExp(escapeRegExp(searchQuery), "i");
      const matchedBrands = await Brand.find({ name: regex }).select("_id").lean();
      const brandIds = matchedBrands.map((b: any) => b._id);

      query.$or = [{ name: regex }, { description: regex }, { tags: regex }];
      if (brandIds.length > 0) {
        query.$or.push({ brand: { $in: brandIds } });
      }
    }

    let mongooseQuery = Product.find(query)
      .populate({ path: "category", model: Category })
      .populate({ path: "brand", model: Brand });

    // Sorting logic
    if (sort === "low") {
      mongooseQuery = mongooseQuery.sort({ salePrice: 1 });
    } else if (sort === "high") {
      mongooseQuery = mongooseQuery.sort({ salePrice: -1 });
    } else if (sort === "rating") {
      mongooseQuery = mongooseQuery.sort({ "rating.average": -1 });
    } else {
      mongooseQuery = mongooseQuery.sort({ createdAt: -1 });
    }

    const rawProducts = await mongooseQuery.lean().exec();
    const normalized = rawProducts.map((p: any) => normalizeProduct(p));
    const withFlashSales = await applyFlashSales(normalized);
    // CDN-cache listings 60s (5min stale-while-revalidate). Per-URL, so each
    // filter/sort combo caches independently; repeat browses skip the DB.
    return cachedJson(withFlashSales, 60, 300);
  } catch (error: any) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
