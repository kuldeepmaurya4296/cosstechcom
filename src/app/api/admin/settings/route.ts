import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Settings from "@/lib/models/Settings";
import Category from "@/lib/models/Category";
import { auth } from "@/lib/auth";
import { logAdminActivity } from "@/lib/activity-logger";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const [general, shipping, categories] = await Promise.all([
      Settings.findOne({ key: "general" }).lean(),
      Settings.findOne({ key: "shipping_methods" }).lean(),
      Category.find({ isActive: true }).select("name slug commissionRate").lean(),
    ]);

    return NextResponse.json({
      general: general?.value || {},
      shipping: shipping?.value || [],
      categories,
    });
  } catch (error: any) {
    console.error("Failed to fetch admin settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Missing key or value parameter" }, { status: 400 });
    }

    if (key === "general" || key === "shipping_methods") {
      await Settings.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      );

      await logAdminActivity({
        action: `UPDATE_SETTINGS_${key.toUpperCase()}`,
        details: `Updated platform settings for ${key}`,
      });
    } else if (key === "categories") {
      if (!Array.isArray(value)) {
        return NextResponse.json({ error: "Category updates must be an array" }, { status: 400 });
      }

      // Bulk update category commission rates
      const promises = value.map((cat: any) =>
        Category.findByIdAndUpdate(cat.id, { commissionRate: Number(cat.commissionRate) })
      );
      await Promise.all(promises);

      await logAdminActivity({
        action: "UPDATE_CATEGORY_COMMISSIONS",
        details: `Updated commission rates for ${value.length} categories`,
      });
    } else {
      return NextResponse.json({ error: "Invalid settings key" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
