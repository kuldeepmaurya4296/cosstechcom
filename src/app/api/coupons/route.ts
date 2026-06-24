import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Coupon from "@/lib/models/Coupon";
import { coupons as fallbackCoupons } from "@/data/coupons";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const isAdmin = session?.user?.role === "admin";

    const db = await connectToDatabase();
    if (!db) {
      console.warn("Using local mock coupons fallback (database offline).");
      return NextResponse.json(fallbackCoupons);
    }

    // Admins see all coupons, shoppers only see active ones
    const filter = isAdmin ? {} : { isActive: true };
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(coupons);
  } catch (error: any) {
    console.error("Failed to fetch coupons:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch coupons" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const body = await request.json();
    const { code, type, value, minCartValue, validFrom, validTill, usageLimit, isActive } = body;

    if (!code || !type || value === undefined || !validTill) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const uppercaseCode = code.trim().toUpperCase();

    // Check if code already exists
    const existing = await Coupon.findOne({ code: uppercaseCode });
    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 400 },
      );
    }

    const newCoupon = await Coupon.create({
      code: uppercaseCode,
      type,
      value: Number(value),
      minCartValue: Number(minCartValue || 0),
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validTill: new Date(validTill),
      usageLimit: usageLimit !== undefined && usageLimit !== "" ? Number(usageLimit) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error: any) {
    console.error("Failed to create coupon:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create coupon" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const body = await request.json();
    const { id, code, type, value, minCartValue, validFrom, validTill, usageLimit, isActive } =
      body;

    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (code) {
      const uppercaseCode = code.trim().toUpperCase();
      if (uppercaseCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: uppercaseCode });
        if (existing) {
          return NextResponse.json(
            { error: "A coupon with this code already exists" },
            { status: 400 },
          );
        }
        coupon.code = uppercaseCode;
      }
    }

    if (type) coupon.type = type;
    if (value !== undefined) coupon.value = Number(value);
    if (minCartValue !== undefined) coupon.minCartValue = Number(minCartValue);
    if (validFrom) coupon.validFrom = new Date(validFrom);
    if (validTill) coupon.validTill = new Date(validTill);
    if (usageLimit !== undefined)
      coupon.usageLimit = usageLimit !== "" && usageLimit !== null ? Number(usageLimit) : undefined;
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);

    await coupon.save();
    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error("Failed to update coupon:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update coupon" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete coupon:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete coupon" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
