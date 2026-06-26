import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Category from "@/lib/models/Category";
import Product from "@/lib/models/Product";

export async function GET(req: NextRequest) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const { searchParams } = new URL(req.url);
    const levelStr = searchParams.get("level");
    const hasProductsStr = searchParams.get("hasProducts");
    const limitStr = searchParams.get("limit");

    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();

    // Group product counts by category ID in a single aggregation query (approved and active)
    const counts = await Product.aggregate([
      { $match: { isActive: true, approvalStatus: "approved" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countsMap = new Map<string, number>(
      counts.map((c: any) => [c._id ? c._id.toString() : "", c.count]),
    );

    // Build category map and calculate direct counts
    const categoryMap = new Map<string, any>();
    categories.forEach((cat: any) => {
      const catId = cat._id.toString();
      categoryMap.set(catId, {
        ...cat,
        id: catId,
        directCount: countsMap.get(catId) || 0,
        productCount: countsMap.get(catId) || 0,
        childrenIds: []
      });
    });

    // Build children relationships
    categories.forEach((cat: any) => {
      const catId = cat._id.toString();
      if (cat.parentId) {
        const parentIdStr = cat.parentId.toString();
        const parentNode = categoryMap.get(parentIdStr);
        if (parentNode) {
          parentNode.childrenIds.push(catId);
        }
      }
    });

    // Recursively roll up counts
    const computeRolledUpCount = (catId: string): number => {
      const node = categoryMap.get(catId);
      if (!node) return 0;
      
      let total = node.directCount;
      for (const childId of node.childrenIds) {
        total += computeRolledUpCount(childId);
      }
      node.productCount = total;
      return total;
    };

    // Calculate rolled-up counts for all Level 1/top categories
    categories.forEach((cat: any) => {
      if (!cat.parentId || cat.level === 1) {
        computeRolledUpCount(cat._id.toString());
      }
    });

    // Convert map back to list
    let result = Array.from(categoryMap.values());

    // Apply filters
    if (levelStr) {
      const filterLevel = parseInt(levelStr);
      if (!isNaN(filterLevel)) {
        result = result.filter((cat) => cat.level === filterLevel);
      }
    }

    if (hasProductsStr === "true") {
      result = result.filter((cat) => cat.productCount > 0);
    }

    if (limitStr) {
      const limit = parseInt(limitStr);
      if (!isNaN(limit)) {
        result = result.slice(0, limit);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
