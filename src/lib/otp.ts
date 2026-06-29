import redisClient from './redis';
import { sendSms } from './sms';

const OTP_EXPIRY = 300; // 5 minutes in seconds

/**
 * Generate a 6-digit OTP, store it in Redis with expiry, and send it via SMS.
 */
export async function generateAndSendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  // Clean the phone number (strip whitespace)
  const cleanPhone = phone.trim();
  if (!/^\+?[1-9]\d{1,14}$/.test(cleanPhone)) {
    return { success: false, error: 'Invalid phone number format' };
  }

  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in Redis (key: `otp:${phone}`)
  try {
    await redisClient.set(`otp:${cleanPhone}`, otp, { ex: OTP_EXPIRY });
  } catch (err: any) {
    console.error('Failed to store OTP in Redis:', err);
    return { success: false, error: 'Failed to initialize verification session' };
  }

  // Send via SMS
  const message = `Your CosstechCom OTP is ${otp}. Valid for 5 minutes. Do not share this with anyone.`;
  const smsResult = await sendSms({
    to: cleanPhone,
    message,
    // You can specify an SMS template ID here if configured in environment
    templateId: process.env.MSG91_OTP_TEMPLATE_ID,
  });

  if (!smsResult.success) {
    return { success: false, error: smsResult.error || 'Failed to send SMS' };
  }

  return { success: true };
}

/**
 * Verify if the provided OTP matches the one stored in Redis for this phone number.
 * Deletes the OTP on successful verification to prevent reuse.
 */
export async function verifyOtp(phone: string, inputOtp: string): Promise<boolean> {
  const cleanPhone = phone.trim();
  const key = `otp:${cleanPhone}`;

  try {
    const storedOtp = await redisClient.get(key);
    if (!storedOtp) return false;

    const matches = (storedOtp as string).trim() === inputOtp.trim();
    if (matches) {
      // Delete OTP on success to prevent reuse
      await redisClient.del(key);
      return true;
    }
  } catch (err) {
    console.error('Failed to verify OTP from Redis:', err);
  }

  return false;
}
