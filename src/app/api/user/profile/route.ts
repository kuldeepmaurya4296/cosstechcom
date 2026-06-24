import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import Order from "@/lib/models/Order";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database offline" }, { status: 500 });
    }

    const userId = session.user.id;
    const user = await User.findById(userId).select("-password").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Compute stats
    const totalOrders = await Order.countDocuments({ userId });
    const orders = await Order.find({ userId });
    const totalSpent = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
    const savedAddressesCount = user.addresses?.length || 0;

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        createdAt: user.createdAt,
      },
      stats: {
        totalOrders,
        totalSpent,
        savedAddressesCount,
      },
    });
  } catch (error: any) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database offline" }, { status: 500 });
    }

    const body = await request.json();
    const { name, phone } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const userId = session.user.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, phone: phone || "" },
      { new: true, runValidators: true },
    )
      .select("-password")
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Profile PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
