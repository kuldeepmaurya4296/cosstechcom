import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import NewsletterSubscriber from "@/lib/models/NewsletterSubscriber";
import { sendWelcomeEmail } from "@/lib/email";
import { z } from "zod";

const subscribeSchema = z.object({
  name: z.string().min(1, "Please provide your name"),
  email: z.string().email("Please provide a valid email address"),
  phone: z.string().min(10, "Please provide a valid phone number (at least 10 digits)"),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const body = await request.json();
    const validation = subscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { name, email, phone, message } = validation.data;

    // Check if already subscribed
    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "This email is already subscribed to our newsletter." },
        { status: 400 },
      );
    }

    // Save subscriber
    const newSubscriber = await NewsletterSubscriber.create({ name, email, phone, message });

    // Send Welcome Email asynchronously
    try {
      await sendWelcomeEmail(email, name);
    } catch (mailError) {
      console.error("Failed to trigger welcome email inside subscription route:", mailError);
      // We do not fail the request if only the welcome email fails
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing to our newsletter!",
      subscriber: newSubscriber,
    });
  } catch (error: any) {
    console.error("Newsletter subscription failed:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during subscription." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
