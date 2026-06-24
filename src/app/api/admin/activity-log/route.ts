import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ActivityLog from "@/lib/models/ActivityLog";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "vendor")) {
      return NextResponse.json(
        { error: "Unauthorized. Administrative privileges required." },
        { status: 401 },
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const query: any = {};
    if (unreadOnly) {
      query.isRead = false;
    }

    const logs = await ActivityLog.find(query).sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Failed to fetch activity logs:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch logs" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "vendor")) {
      return NextResponse.json(
        { error: "Unauthorized. Administrative privileges required." },
        { status: 401 },
      );
    }

    await connectToDatabase();

    // Mark all as read
    await ActivityLog.updateMany({ isRead: false }, { $set: { isRead: true } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update activity logs:", error);
    return NextResponse.json({ error: error.message || "Failed to update logs" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
