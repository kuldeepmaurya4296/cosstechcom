import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { verifyOtp } from '@/lib/otp';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone number and OTP are required' }, { status: 400 });
    }

    const cleanPhone = phone.trim();

    // Rate limit OTP verification per phone number to prevent brute-forcing
    const limitResult = await rateLimit(`otp-verify:${cleanPhone}`, { limit: 5, windowSeconds: 300 });
    if (!limitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Verify OTP using redis/in-memory helper
    const isValid = await verifyOtp(cleanPhone, otp);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user exists by phone
    let user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      // Check if dummy email already exists just in case
      const dummyEmail = `${cleanPhone.replace('+', '')}@cosstechcom.com`;
      const emailExists = await User.findOne({ email: dummyEmail });
      
      const finalEmail = emailExists 
        ? `${cleanPhone.replace('+', '')}-${Date.now()}@cosstechcom.com` 
        : dummyEmail;

      // Auto-register new customer
      user = await User.create({
        name: `User-${cleanPhone.slice(-4)}`,
        phone: cleanPhone,
        email: finalEmail,
        role: 'customer',
        isPhoneVerified: true,
        isActive: true,
        isEmailVerified: false,
      });
    } else {
      user.isPhoneVerified = true;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }
    });
  } catch (err: any) {
    console.error('OTP Verify route error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
