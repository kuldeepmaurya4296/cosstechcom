import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Cart from "@/lib/models/Cart";
import User from "@/lib/models/User";
import { sendAbandonedCartEmail } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET || "default_cron_secret";

    if (secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Abandoned state: Cart was updated more than 45 minutes ago but less than 24 hours ago
    const thresholdStart = new Date(Date.now() - 45 * 60 * 1000);
    const thresholdEnd = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const abandonedCarts = await Cart.find({
      emailSent: false,
      "items.0": { $exists: true }, // has at least one item
      updatedAt: { $lte: thresholdStart, $gte: thresholdEnd },
    }).populate({ path: "userId", model: User });

    let sentCount = 0;
    for (const cart of abandonedCarts) {
      const user = cart.userId as any;
      if (user?.email) {
        const name = user.name || "Customer";
        const emailSentSuccess = await sendAbandonedCartEmail(user.email, name, cart.items);
        if (emailSentSuccess) {
          cart.emailSent = true;
          await cart.save();
          sentCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: abandonedCarts.length,
      emailsSent: sentCount,
    });
  } catch (error: any) {
    console.error("Failed to run abandoned cart cron:", error);
    return NextResponse.json({ error: error.message || "Cron run failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
