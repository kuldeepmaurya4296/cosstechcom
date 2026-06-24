import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Category from "@/lib/models/Category";
import Product from "@/lib/models/Product";

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();

    // Group product counts by category ID in a single aggregation query
    const counts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countsMap = new Map<string, number>(
      counts.map((c: any) => [c._id ? c._id.toString() : "", c.count]),
    );

    const categoriesWithCount = categories.map((cat: any) => {
      const catIdStr = cat._id.toString();
      return {
        ...cat,
        id: catIdStr,
        productCount: countsMap.get(catIdStr) || 0,
      };
    });
    return NextResponse.json(categoriesWithCount);
  } catch (error: any) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export const revalidate = 3600;
