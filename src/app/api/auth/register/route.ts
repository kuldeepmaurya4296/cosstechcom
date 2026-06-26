import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import Referral from "@/lib/models/Referral";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Rate limit: 5 registrations per IP per minute
    const ip = getClientIp(request);
    const limiter = await rateLimit(`register:${ip}`, { limit: 5, windowSeconds: 60 });
    if (!limiter.allowed) {
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please try again in ${limiter.resetIn} seconds.`,
        },
        { status: 429 },
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password, phone, referralCode } = validation.data;

    const db = await connectToDatabase();
    const normalizedEmail = email.toLowerCase().trim();

    if (!db) {
      return NextResponse.json(
        { error: "Database connection failed. Please try again later." },
        { status: 500 },
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    // Validate and find referrer if referralCode is provided
    let referredBy: any = null;
    let referrerDoc: any = null;
    if (referralCode) {
      referrerDoc = await User.findOne({ referralCode: referralCode.toUpperCase().trim() });
      if (referrerDoc) {
        referredBy = referrerDoc._id;
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate own custom unique referral code
    const ownPrefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "USER");
    const ownRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ownReferralCode = `COSS-${ownPrefix}-${ownRandom}`;

    // Create the user
    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || "",
      role: "customer",
      isActive: true,
      isEmailVerified: false,
      addresses: [],
      referralCode: ownReferralCode,
      referredBy: referredBy || undefined,
    });

    // Create a pending Referral record if valid referral was used
    if (referrerDoc && referralCode) {
      await Referral.create({
        referrerId: referrerDoc._id,
        referredUserId: newUser._id,
        code: referralCode.toUpperCase().trim(),
        reward: 100, // ₹100 reward
        status: "pending",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Registration failed:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during registration" },
      { status: 500 },
    );
  }
}
