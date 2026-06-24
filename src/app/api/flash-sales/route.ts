import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import FlashSale from "@/lib/models/FlashSale";
import { cachedJson } from "@/lib/api-cache";

export async function GET() {
  try {
    await connectToDatabase();
    const now = new Date();

    // Find active flash sales and populate products
    const activeSales = await FlashSale.find({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    })
      .populate("products")
      .lean();

    // Time-sensitive but tolerant of brief staleness — 30s CDN cache.
    return cachedJson(activeSales, 30, 120);
  } catch (error: any) {
    console.error("Failed to fetch active flash sales:", error);
    return NextResponse.json({ error: "Failed to fetch active flash sales" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
