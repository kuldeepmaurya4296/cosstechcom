import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Settings from "@/lib/models/Settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const doc = await Settings.findOne({ key: "announcements" }).lean();
    return NextResponse.json({
      list: doc?.value?.list || [
        "Hand-stitched footwear",
        "Free shipping over ₹2000",
        "Official Lakhani · Paragon · Touch retailer",
      ],
      isActive: doc?.value?.isActive ?? true,
    });
  } catch (error: any) {
    console.error("Failed to fetch announcements:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch announcements" },
      { status: 500 },
    );
  }
}
