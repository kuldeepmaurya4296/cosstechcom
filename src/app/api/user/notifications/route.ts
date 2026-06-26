import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Notification from "@/lib/models/Notification";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const notifications = await Notification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error("GET Notifications Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await Notification.updateMany(
        { userId: session.user.id, isRead: false },
        { $set: { isRead: true } }
      );
      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: session.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    console.error("PUT Notifications Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update notification" }, { status: 500 });
  }
}
