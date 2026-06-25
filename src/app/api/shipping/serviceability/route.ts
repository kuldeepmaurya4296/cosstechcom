import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/lib/models/Product";
import VendorProfile from "@/lib/models/VendorProfile";
import { checkServiceability } from "@/lib/shipping";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const deliveryPincode = searchParams.get("deliveryPincode");

    if (!productId || !deliveryPincode) {
      return NextResponse.json({ error: "productId and deliveryPincode parameters are required" }, { status: 400 });
    }

    if (!/^\d{6}$/.test(deliveryPincode.trim())) {
      return NextResponse.json({ error: "Invalid delivery PIN code format" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Fetch product
    const product = await Product.findById(productId).select("vendorId").lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 2. Fetch vendor profile to get pickup pincode
    let pickupPincode = "302001"; // Fallback default (Rajasthan)
    if (product.vendorId) {
      const vendorProfile = await VendorProfile.findOne({ userId: product.vendorId }).select("businessAddress").lean();
      if (vendorProfile && vendorProfile.businessAddress) {
        // Extract 6-digit PIN code from address string
        const match = vendorProfile.businessAddress.match(/\b\d{6}\b/);
        if (match) {
          pickupPincode = match[0];
        }
      }
    }

    // 3. Check serviceability
    const result = await checkServiceability(pickupPincode, deliveryPincode.trim(), 0.5);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to check shipping serviceability:", error);
    return NextResponse.json({ error: error.message || "Failed to check shipping serviceability" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
