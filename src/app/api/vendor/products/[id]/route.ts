import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/lib/models/Product";
import { auth } from "@/lib/auth";
import { logAdminActivity } from "@/lib/activity-logger";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await context.params;
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.vendorId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to this product" }, { status: 403 });
    }

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

    // Apply updates
    if (name) {
      product.name = name;
      product.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);
    }
    if (description) product.description = description;
    if (brand) product.brand = brand;
    if (category) product.category = category;
    if (gender) product.gender = gender;
    if (price) product.price = price;
    if (salePrice) product.salePrice = salePrice;
    if (images) product.images = images;
    if (variants) product.variants = variants;
    if (specifications) product.specifications = specifications;
    if (freeShipping !== undefined) product.freeShipping = !!freeShipping;
    if (estimatedDeliveryDays) product.estimatedDeliveryDays = estimatedDeliveryDays;

    // Force governance re-approval
    product.approvalStatus = "pending";
    product.isActive = false;

    await product.save();

    await logAdminActivity({
      action: "VENDOR_EDIT_PRODUCT",
      details: `Vendor edited product "${product.name}" (ID: ${id}). Flagged for re-approval.`,
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Failed to update vendor product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await context.params;
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.vendorId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to this product" }, { status: 403 });
    }

    // Instead of absolute deletion, we can deactivate the product to preserve order history references
    product.isActive = false;
    product.approvalStatus = "rejected";
    await product.save();

    await logAdminActivity({
      action: "VENDOR_DELETE_PRODUCT",
      details: `Vendor deactivated/archived product "${product.name}" (ID: ${id}).`,
    });

    return NextResponse.json({ success: true, message: "Product deactivated/archived successfully" });
  } catch (error: any) {
    console.error("Failed to deactivate product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to archive product" },
      { status: 500 }
    );
  }
}
