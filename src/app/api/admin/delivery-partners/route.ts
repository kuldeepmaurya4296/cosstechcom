import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import DeliveryPartner from "@/lib/models/DeliveryPartner";
import { auth } from "@/lib/auth";
import { z } from "zod";

const partnerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["SELF", "THIRD_PARTY"]),
  phone: z.string().optional().nullable(),
  trackingUrlTemplate: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "vendor")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin/Vendor role required." },
        { status: 401 },
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const partners = await DeliveryPartner.find({}).sort({ name: 1 });
    return NextResponse.json(partners);
  } catch (error: any) {
    console.error("Failed to fetch delivery partners:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch delivery partners" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const body = await request.json();
    const parsed = partnerSchema.parse(body);

    // Check duplicate name
    const existing = await DeliveryPartner.findOne({ name: parsed.name });
    if (existing) {
      return NextResponse.json(
        { error: "A delivery partner or staff member with this name already exists" },
        { status: 400 },
      );
    }

    const partner = await DeliveryPartner.create(parsed);
    return NextResponse.json({ success: true, partner });
  } catch (error: any) {
    console.error("Failed to create delivery partner:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create delivery partner" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Delivery Partner ID is required" }, { status: 400 });
    }

    const parsed = partnerSchema.parse(data);

    // Check duplicate name excluding self
    const existing = await DeliveryPartner.findOne({ name: parsed.name, _id: { $ne: id } });
    if (existing) {
      return NextResponse.json(
        { error: "A delivery partner or staff member with this name already exists" },
        { status: 400 },
      );
    }

    const partner = await DeliveryPartner.findByIdAndUpdate(id, parsed, { new: true });
    if (!partner) {
      return NextResponse.json({ error: "Delivery Partner not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, partner });
  } catch (error: any) {
    console.error("Failed to update delivery partner:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update delivery partner" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Delivery Partner ID is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const deleted = await DeliveryPartner.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Delivery Partner not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Delivery Partner deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete delivery partner:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete delivery partner" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
