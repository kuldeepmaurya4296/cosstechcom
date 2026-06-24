import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    // Find user by valid unexpired token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Password reset link is invalid or has expired." },
        { status: 400 },
      );
    }

    // Hash the new password and update user record
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset password" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
