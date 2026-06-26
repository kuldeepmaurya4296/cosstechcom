import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import Referral from "@/lib/models/Referral";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find user to get referral code
    let user = await User.findById(session.user.id).select("referralCode name").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let referralCode = user.referralCode;

    // Generate own code if they don't have one (for older users seeded in the database)
    if (!referralCode) {
      const ownPrefix = user.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "USER");
      const ownRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
      referralCode = `COSS-${ownPrefix}-${ownRandom}`;
      await User.findByIdAndUpdate(session.user.id, { $set: { referralCode } });
    }

    // Fetch all referrals made by this user
    const referrals = await Referral.find({ referrerId: session.user.id })
      .populate({ path: "referredUserId", model: User, select: "name email" })
      .sort({ createdAt: -1 })
      .lean();

    const formattedReferrals = referrals.map((ref: any) => {
      const referredUser = ref.referredUserId;
      return {
        id: ref._id.toString(),
        friendName: referredUser ? referredUser.name : "Anonymous Friend",
        friendEmail: referredUser ? `${referredUser.email.substring(0, 3)}***@${referredUser.email.split("@")[1]}` : "",
        reward: ref.reward,
        status: ref.status,
        createdAt: ref.createdAt,
      };
    });

    return NextResponse.json({ referralCode, referrals: formattedReferrals });
  } catch (error: any) {
    console.error("GET Referrals Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch referrals" }, { status: 500 });
  }
}
