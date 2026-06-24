import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "customer" | "admin" | "vendor" | "delivery_partner" | "support";
      vendorStatus?: "pending" | "approved" | "rejected" | "suspended" | null;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: "customer" | "admin" | "vendor" | "delivery_partner" | "support";
    vendorStatus?: "pending" | "approved" | "rejected" | "suspended" | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "customer" | "admin" | "vendor" | "delivery_partner" | "support";
    vendorStatus?: "pending" | "approved" | "rejected" | "suspended" | null;
  }
}
