import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { generateAndSendOtp } from '@/lib/otp';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    
    // Rate limit OTP sending: 3 requests per 10 minutes per IP
    const limiter = await rateLimit(`otp-send:${ip}`, { limit: 3, windowSeconds: 600 });
    if (!limiter.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many requests. Please try again after ${limiter.resetIn} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    // Connect to database to verify if phone exists (optional, depending on flow, but let's connect anyway)
    await connectToDatabase();

    // Call OTP helper to generate and send SMS
    const result = await generateAndSendOtp(phone);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send OTP' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (err: any) {
    console.error('OTP Send route error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
