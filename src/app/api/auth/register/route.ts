import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Rate limit: 5 registrations per IP per minute
    const ip = getClientIp(request);
    const limiter = rateLimit(`register:${ip}`, { limit: 5, windowSeconds: 60 });
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

    const { name, email, password, phone } = validation.data;

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

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
    });

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
