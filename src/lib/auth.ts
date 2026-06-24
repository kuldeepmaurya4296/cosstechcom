import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const db = await connectToDatabase();
        const email = (credentials.email as string).toLowerCase().trim();

        if (!db) {
          throw new Error("Database connection failed. Please try again later.");
        }

        const user = await User.findOne({ email });

        if (!user) {
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
          throw new Error("Incorrect password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
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
        token.vendorStatus = (user as any).vendorStatus || null;
      }

      if (account && account.provider === "google") {
        const db = await connectToDatabase();
        const email = token.email?.toLowerCase().trim();

        if (!db) {
          throw new Error("Database connection failed. Google sign-in unavailable.");
        }

        // Dynamic lookup or registration for google OAuth users
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
          // Link google account to existing email user
          dbUser.googleId = account.providerAccountId;
          dbUser.isEmailVerified = true;
          await dbUser.save();
        }

        token.id = dbUser._id.toString();
        token.role = dbUser.role || "customer";
        token.vendorStatus = dbUser.vendorStatus || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
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
