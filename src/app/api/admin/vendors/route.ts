import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import VendorProfile from "@/lib/models/VendorProfile";
import { auth } from "@/lib/auth";
import { logAdminActivity } from "@/lib/activity-logger";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const profiles = await VendorProfile.find()
      .populate("userId", "name email role vendorStatus")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(profiles);
  } catch (error: any) {
    console.error("Failed to fetch vendor applications:", error);
    return NextResponse.json({ error: "Failed to fetch vendor profiles" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { userId, action, rejectionReason } = body;

    if (!userId || !["approve", "reject", "suspend"].includes(action)) {
      return NextResponse.json({ error: "Invalid action parameters" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await VendorProfile.findOne({ userId });
    if (!profile) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    if (action === "approve") {
      user.vendorStatus = "approved";
      user.role = "vendor";
      profile.verificationStatus = "approved";
      profile.approvedAt = new Date();
      profile.approvedBy = new mongoose.Types.ObjectId(session.user.id) as any;
    } else if (action === "reject") {
      user.vendorStatus = "rejected";
      user.role = "customer"; // Revert to customer
      profile.verificationStatus = "rejected";
    } else if (action === "suspend") {
      user.vendorStatus = "suspended";
      profile.verificationStatus = "suspended";
    }

    await Promise.all([user.save(), profile.save()]);

    await logAdminActivity({
      action: `${action.toUpperCase()}_VENDOR`,
      details: `${action.charAt(0).toUpperCase() + action.slice(1)}d vendor store "${profile.storeName}" (User ID: ${userId})`,
    });

    return NextResponse.json({ success: true, user, profile });
  } catch (error: any) {
    console.error("Failed to moderate vendor:", error);
    return NextResponse.json({ error: error.message || "Moderation failed" }, { status: 500 });
  }
}

import mongoose from "mongoose";
