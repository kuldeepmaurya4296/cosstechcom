import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import VendorProfile from "@/lib/models/VendorProfile";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      storeName,
      businessAddress,
      gstNumber,
      panNumber,
      bankAccount,
      storeDescription,
      storeLogo,
      storeBanner,
    } = body;

    if (!storeName || !businessAddress || !gstNumber || !panNumber || !bankAccount) {
      return NextResponse.json(
        { error: "Missing required vendor onboarding fields" },
        { status: 400 }
      );
    }

    const { holderName, bankName, accountNumber, ifscCode } = bankAccount;
    if (!holderName || !bankName || !accountNumber || !ifscCode) {
      return NextResponse.json({ error: "Missing bank account details" }, { status: 400 });
    }

    const storeSlug = storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-");

    const existingProfile = await VendorProfile.findOne({ storeSlug });
    if (existingProfile) {
      return NextResponse.json({ error: "A store with this name already exists" }, { status: 400 });
    }

    const existingUser = await User.findById(session.user.id);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingUser.role === "vendor" || existingUser.vendorStatus) {
      return NextResponse.json(
        { error: "Vendor profile already exists or is pending review" },
        { status: 400 }
      );
    }

    const profile = await VendorProfile.create({
      userId: session.user.id,
      storeName,
      storeSlug,
      storeDescription,
      storeLogo,
      storeBanner,
      businessAddress,
      gstNumber,
      panNumber,
      bankAccount,
      verificationStatus: "pending",
    });

    existingUser.role = "vendor";
    existingUser.vendorStatus = "pending";
    existingUser.storeName = storeName;
    existingUser.storeSlug = storeSlug;
    await existingUser.save();

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("Failed to register vendor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register vendor" },
      { status: 500 }
    );
  }
}
