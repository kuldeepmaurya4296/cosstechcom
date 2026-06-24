import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { sendEmail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Generic message for security (don't reveal if user exists)
    const successResponse = NextResponse.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    });

    if (!user) {
      return successResponse;
    }

    // Generate token and expiration
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour expiration
    await user.save();

    // Reset Link
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Premium HTML Email Template
    const emailHtml = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #fcfcfd; border: 1px solid #eceef1; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-family: 'Playfair Display', serif; color: #191c1e; font-size: 26px; margin: 0;">Raja Boot House</h2>
          <p style="color: #75777d; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 5px 0 0 0;">The Atelier</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eceef1; margin-bottom: 30px;" />
        <p style="color: #191c1e; font-size: 16px; line-height: 24px; margin-bottom: 20px;">Hello ${user.name},</p>
        <p style="color: #45474c; font-size: 14px; line-height: 22px; margin-bottom: 25px;">
          You are receiving this email because you (or someone else) requested a password reset for your account at Raja Boot House.
        </p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetUrl}" target="_blank" style="background-color: #000000; color: #ffffff; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            Reset Password
          </a>
        </div>
        <p style="color: #45474c; font-size: 14px; line-height: 22px; margin-bottom: 15px;">
          Alternatively, copy and paste this link into your browser:
        </p>
        <p style="word-break: break-all; font-size: 12px; color: #535f74; background-color: #f2f4f7; padding: 10px; border-radius: 6px; margin-bottom: 30px;">
          ${resetUrl}
        </p>
        <p style="color: #ba1a1a; font-size: 13px; line-height: 20px; font-weight: 500; margin-bottom: 25px;">
          Please note: This link is only valid for 1 hour. If you did not request this reset, you can safely ignore this email.
        </p>
        <hr style="border: 0; border-top: 1px solid #eceef1; margin: 30px 0 20px 0;" />
        <div style="text-align: center; color: #75777d; font-size: 12px;">
          <p style="margin: 0 0 5px 0;">&copy; ${new Date().getFullYear()} Raja Boot House. All rights reserved.</p>
          <p style="margin: 0;">Gorakhpur, Uttar Pradesh, India</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request - Raja Boot House",
      html: emailHtml,
    });

    return successResponse;
  } catch (error: any) {
    console.error("Forgot password API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process forgot password request" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
