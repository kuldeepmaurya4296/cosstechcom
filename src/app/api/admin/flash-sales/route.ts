import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import FlashSale from "@/lib/models/FlashSale";
import { auth } from "@/lib/auth";
import { logAdminActivity } from "@/lib/activity-logger";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "vendor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const sales = await FlashSale.find({}).sort({ startTime: -1 }).populate("products").lean();

    return NextResponse.json(sales);
  } catch (error: any) {
    console.error("Failed to fetch admin flash sales:", error);
    return NextResponse.json({ error: "Failed to fetch flash sales" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "vendor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { name, discountType, discountValue, products, startTime, endTime, isActive } = body;

    if (
      !name ||
      !discountType ||
      discountValue === undefined ||
      !products ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const flashSale = await FlashSale.create({
      name,
      discountType,
      discountValue: Number(discountValue),
      products,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isActive: isActive !== false,
    });

    await logAdminActivity({
      action: "CREATE_FLASH_SALE",
      details: `Created flash sale "${name}" with ${products.length} products.`,
    });

    return NextResponse.json(flashSale);
  } catch (error: any) {
    console.error("Failed to create flash sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create flash sale" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
