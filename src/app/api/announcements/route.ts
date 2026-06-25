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
        "Welcome to CosstechCom Marketplace",
        "Free shipping on orders over ₹2000",
        "Top Brands. Verified Sellers. Great Deals.",
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
