import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { releaseExpiredReservations } from "@/lib/inventory";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET || "default_cron_secret";

    if (secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const releasedCount = await releaseExpiredReservations();

    return NextResponse.json({
      success: true,
      releasedCount,
    });
  } catch (error: any) {
    console.error("Failed to run inventory hold release cron:", error);
    return NextResponse.json({ error: error.message || "Cron run failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
