import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Brand from "@/lib/models/Brand";

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const brands = await Brand.find({ isActive: true }).sort({ order: 1 }).lean();

    // Return a simplified array of brand names for the marquee
    const brandNames = brands.map((b: any) => b.name);

    return NextResponse.json(brandNames);
  } catch (error: any) {
    console.error("Failed to fetch brands:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch brands" }, { status: 500 });
  }
}

export const revalidate = 3600; // Cache for 1 hour
