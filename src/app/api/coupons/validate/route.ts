import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Coupon from "@/lib/models/Coupon";
import { coupons as fallbackCoupons } from "@/data/coupons";

export async function POST(request: Request) {
  try {
    const { code, cartValue } = await request.json();

    if (!code) {
      return NextResponse.json(
        { valid: false, message: "Coupon code is required" },
        { status: 400 },
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      // Fallback local coupon validation
      const matched = fallbackCoupons.find((c) => c.code.toUpperCase() === code.toUpperCase());
      if (!matched) {
        return NextResponse.json({ valid: false, message: "Invalid coupon code" });
      }

      const expiry = new Date(matched.expiresAt);
      if (expiry < new Date()) {
        return NextResponse.json({ valid: false, message: "Coupon has expired" });
      }

      // Default welcome and freeship threshold check
      const minVal = code.toUpperCase() === "FREESHIP" ? 2000 : 500;
      if (cartValue < minVal) {
        return NextResponse.json({
          valid: false,
          message: `Minimum purchase of ₹${minVal} required`,
        });
      }

      return NextResponse.json({
        valid: true,
        code: matched.code,
        type: matched.type,
        value: matched.value,
        message: `${matched.description} applied successfully!`,
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return NextResponse.json({ valid: false, message: "Invalid or inactive coupon code" });
    }

    const now = new Date();
    if (coupon.validFrom > now) {
      return NextResponse.json({ valid: false, message: "Coupon offer is not active yet" });
    }

    if (coupon.validTill < now) {
      return NextResponse.json({ valid: false, message: "Coupon has expired" });
    }

    if (cartValue < coupon.minCartValue) {
      return NextResponse.json({
        valid: false,
        message: `Minimum cart value of ₹${coupon.minCartValue} required for this coupon`,
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, message: "Coupon usage limit reached" });
    }

    // Map DB coupon types to frontend expected types
    let mappedType = coupon.type;
    if (coupon.type === "Percentage") {
      mappedType = "percent";
    } else if (coupon.type === "Flat") {
      mappedType = "fixed";
    } else if (coupon.type === "Free Shipping") {
      mappedType = "fixed";
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: mappedType,
      value: coupon.value,
      message: "Coupon applied successfully!",
    });
  } catch (error: any) {
    console.error("Coupon validation failed:", error);
    return NextResponse.json({ valid: false, message: "Server validation error" }, { status: 500 });
  }
}
