import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  // Keep heavy Node-native deps out of the bundle — smaller serverless functions,
  // faster cold starts, and no mongoose/bcrypt bundling issues on Vercel.
  serverExternalPackages: ["mongoose", "bcryptjs", "razorpay", "nodemailer"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
};

export default nextConfig;
