import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/lib/models/Product";
import { auth } from "@/lib/auth";
import { logAdminActivity } from "@/lib/activity-logger";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const products = await Product.find({ vendorId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Failed to fetch vendor products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      name,
      description,
      brand,
      category,
      gender,
      price,
      salePrice,
      variants,
      images,
      specifications,
      freeShipping,
      estimatedDeliveryDays,
    } = body;

    if (!name || !description || !brand || !category || !price || !salePrice) {
      return NextResponse.json({ error: "Missing required product details" }, { status: 400 });
    }

    const slug =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now().toString(36);

    const product = await Product.create({
      name,
      slug,
      description,
      brand,
      category,
      vendorId: session.user.id,
      gender: gender || "None",
      price,
      salePrice,
      images: images || [],
      variants: variants || [],
      specifications: specifications || [],
      freeShipping: !!freeShipping,
      estimatedDeliveryDays: estimatedDeliveryDays || 5,
      approvalStatus: "pending", // Requires admin approval
      isActive: false, // Inactive until approved
    });

    await logAdminActivity({
      action: "VENDOR_CREATE_PRODUCT",
      details: `Vendor created product "${product.name}" (ID: ${product._id}). Flagged for approval.`,
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Failed to create vendor product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
