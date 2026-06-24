import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Banner from "@/lib/models/Banner";

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    return NextResponse.json(banners);
  } catch (error: any) {
    console.error("Failed to fetch banners:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch banners" },
      { status: 500 },
    );
  }
}

export const revalidate = 86400;
