import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import redisClient from "./redis";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_COOLDOWN = 15 * 60; // 15 minutes in seconds

/**
 * Checks if an identifier (email or phone) is currently locked out due to brute force attempts.
 */
async function checkBruteForceLock(identifier: string): Promise<{ locked: boolean; timeLeft: number }> {
  const lockKey = `lockout:lock:${identifier}`;
  const isLocked = await redisClient.get(lockKey);
  if (isLocked) {
    return { locked: true, timeLeft: LOCKOUT_COOLDOWN };
  }
  return { locked: false, timeLeft: 0 };
}

/**
 * Records a failed login attempt for an identifier. Locks out if threshold is breached.
 */
async function recordFailedAttempt(identifier: string) {
  const attemptsKey = `lockout:attempts:${identifier}`;
  const lockKey = `lockout:lock:${identifier}`;
  
  try {
    const attempts = await redisClient.incr(attemptsKey);
    if (attempts === 1) {
      await redisClient.expire(attemptsKey, 10 * 60); // 10 minutes window
    }
    
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await redisClient.set(lockKey, "1", { ex: LOCKOUT_COOLDOWN });
      await redisClient.del(attemptsKey);
    }
  } catch (err) {
    console.error("Failed to record login attempt in Redis:", err);
  }
}

/**
 * Resets failed login attempts for an identifier.
 */
async function resetAttempts(identifier: string) {
  const attemptsKey = `lockout:attempts:${identifier}`;
  const lockKey = `lockout:lock:${identifier}`;
  try {
    await redisClient.del(attemptsKey);
    await redisClient.del(lockKey);
  } catch (err) {
    console.error("Failed to reset login attempts in Redis:", err);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const email = (credentials.email as string).toLowerCase().trim();
        
        // Brute force check
        const lock = await checkBruteForceLock(email);
        if (lock.locked) {
          throw new Error("Too many failed attempts. Account locked temporarily for 15 minutes.");
        }

        const db = await connectToDatabase();
        if (!db) {
          throw new Error("Database connection failed. Please try again later.");
        }

        const user = await User.findOne({ email });

        if (!user) {
          await recordFailedAttempt(email);
          throw new Error("No user found with this email");
        }

        if (!user.password) {
          throw new Error("Please log in using Google");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated");
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) {
          await recordFailedAttempt(email);
          throw new Error("Incorrect password");
        }

        // Reset brute force count on success
        await resetAttempts(email);

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          subAdminPermissions: user.subAdminPermissions || [],
          vendorStatus: user.vendorStatus || null,
        };
      },
    }),
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          throw new Error("Missing phone number or OTP");
        }

        const phone = (credentials.phone as string).trim();
        const otpInput = (credentials.otp as string).trim();

        // Brute force check
        const lock = await checkBruteForceLock(phone);
        if (lock.locked) {
          throw new Error("Too many failed attempts. Phone verification locked temporarily for 15 minutes.");
        }

        // Verify OTP from Redis
        const otpKey = `otp:${phone}`;
        const storedOtp = await redisClient.get(otpKey);
        
        if (!storedOtp || storedOtp.trim() !== otpInput) {
          await recordFailedAttempt(phone);
          throw new Error("Invalid or expired OTP");
        }

        // Delete OTP on success to prevent reuse
        await redisClient.del(otpKey);
        await resetAttempts(phone);

        const db = await connectToDatabase();
        if (!db) {
          throw new Error("Database connection failed. Please try again later.");
        }

        let user = await User.findOne({ phone });

        if (!user) {
          // Auto-register user by phone
          const dummyEmail = `${phone.replace("+", "")}@cosstechcom.com`;
          const emailExists = await User.findOne({ email: dummyEmail });
          
          const finalEmail = emailExists 
            ? `${phone.replace("+", "")}-${Date.now()}@cosstechcom.com` 
            : dummyEmail;

          user = await User.create({
            name: `User-${phone.slice(-4)}`,
            phone,
            email: finalEmail,
            role: "customer",
            isPhoneVerified: true,
            isActive: true,
            isEmailVerified: false,
          });
        } else {
          if (!user.isActive) {
            throw new Error("Your account has been deactivated");
          }
          user.isPhoneVerified = true;
          await user.save();
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          subAdminPermissions: user.subAdminPermissions || [],
          vendorStatus: user.vendorStatus || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "customer";
        token.subAdminPermissions = (user as any).subAdminPermissions || [];
        token.vendorStatus = (user as any).vendorStatus || null;
      }

      if (account && account.provider === "google") {
        const db = await connectToDatabase();
        const email = token.email?.toLowerCase().trim();

        if (!db) {
          throw new Error("Database connection failed. Google sign-in unavailable.");
        }

        let dbUser = await User.findOne({ email });

        if (!dbUser) {
          dbUser = await User.create({
            name: token.name || "Google User",
            email,
            googleId: account.providerAccountId,
            role: "customer",
            isActive: true,
            isEmailVerified: true,
          });
        } else if (!dbUser.googleId) {
          dbUser.googleId = account.providerAccountId;
          dbUser.isEmailVerified = true;
          await dbUser.save();
        }

        token.id = dbUser._id.toString();
        token.role = dbUser.role || "customer";
        token.subAdminPermissions = dbUser.subAdminPermissions || [];
        token.vendorStatus = dbUser.vendorStatus || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        (session.user as any).subAdminPermissions = token.subAdminPermissions as string[];
        session.user.vendorStatus = token.vendorStatus as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});
