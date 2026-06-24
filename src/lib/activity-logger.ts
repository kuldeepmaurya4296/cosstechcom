import { connectToDatabase } from "./db";
import ActivityLog from "./models/ActivityLog";
import { auth } from "./auth";
import { headers } from "next/headers";

interface LogParams {
  action: string;
  details?: string;
}

export async function logAdminActivity({ action, details }: LogParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    // Connect to database
    await connectToDatabase();

    let ipAddress = "";
    let userAgent = "";

    try {
      const headersList = await headers();
      ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "";
      userAgent = headersList.get("user-agent") || "";
    } catch (e) {
      // Ignore if called outside request context (e.g. CLI seed scripts)
    }

    const log = await ActivityLog.create({
      adminId: session.user.id,
      adminName: session.user.name || session.user.email || "Unknown Admin",
      action,
      details,
      ipAddress,
      userAgent,
      isRead: false,
    });

    return log;
  } catch (error) {
    console.error("Failed to log admin activity:", error);
    return null;
  }
}
