import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanedEmail });

    if (!user) {
      return NextResponse.json(
        {
          error: "No account found with this email address. Please sign up first.",
        },
        { status: 400 },
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error: "This email is registered via Google Sign-In. Please sign in using Google.",
        },
        { status: 400 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          error: "Your account has been deactivated. Please contact support.",
        },
        { status: 403 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        {
          error: "Incorrect password. Please check your credentials and try again.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Login check error:", error);
    return NextResponse.json({ error: "Server error during login validation" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
