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
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await context.params;
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (action === "approve") {
      product.approvalStatus = "approved";
      product.approvedBy = session.user.id;
      product.approvedAt = new Date();
      product.isActive = true;
    } else if (action === "reject") {
      product.approvalStatus = "rejected";
      product.rejectionReason = rejectionReason || "Rejected by administrator";
      product.isActive = false;
    }

    await product.save();

    await logAdminActivity({
      action: `${action.toUpperCase()}_PRODUCT`,
      details: `${action.charAt(0).toUpperCase() + action.slice(1)}d product "${product.name}" (ID: ${id})`,
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Failed to moderate product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to moderate product" },
      { status: 500 }
    );
  }
}
