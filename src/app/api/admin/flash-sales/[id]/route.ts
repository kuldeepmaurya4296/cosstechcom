import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import FlashSale from "@/lib/models/FlashSale";
import { auth } from "@/lib/auth";
import { logAdminActivity } from "@/lib/activity-logger";

export async function PUT(request: Request, { params }: { params: Promise<any> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "vendor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { name, discountType, discountValue, products, startTime, endTime, isActive } = body;

    const flashSale = await FlashSale.findByIdAndUpdate(
      id,
      {
        name,
        discountType,
        discountValue: Number(discountValue),
        products,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isActive,
      },
      { new: true },
    );

    if (!flashSale) {
      return NextResponse.json({ error: "Flash sale not found" }, { status: 404 });
    }

    await logAdminActivity({
      action: "UPDATE_FLASH_SALE",
      details: `Updated flash sale "${name}" (ID: ${id}).`,
    });

    return NextResponse.json(flashSale);
  } catch (error: any) {
    console.error("Failed to update flash sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update flash sale" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<any> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "vendor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const flashSale = await FlashSale.findByIdAndDelete(id);
    if (!flashSale) {
      return NextResponse.json({ error: "Flash sale not found" }, { status: 404 });
    }

    await logAdminActivity({
      action: "DELETE_FLASH_SALE",
      details: `Deleted flash sale "${flashSale.name}" (ID: ${id}).`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete flash sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete flash sale" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
