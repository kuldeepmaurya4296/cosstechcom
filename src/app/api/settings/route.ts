import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Settings from "@/lib/models/Settings";
import { auth } from "@/lib/auth";
import { cachedJson } from "@/lib/api-cache";

const defaultGeneral = {
  storeName: "CosstechCom",
  supportEmail: "care@cosstechcom.com",
  taxRate: 8,
  currency: "INR — ₹",
  currencySymbol: "₹",
  defaultReturnDays: 7,
  razorpayEnabled: true,
  codEnabled: true,
};

const defaultShipping = [
  { id: "std", name: "Standard", desc: "5–7 days", price: 0 },
  { id: "exp", name: "Express", desc: "2–3 days", price: 150 },
  { id: "same", name: "Same-day (Jawa Rewa)", desc: "Today", price: 350 },
];

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    const [generalDoc, shippingDoc] = await Promise.all([
      Settings.findOne({ key: "general" }).lean(),
      Settings.findOne({ key: "shipping_methods" }).lean(),
    ]);

    const general = generalDoc ? { ...defaultGeneral, ...generalDoc.value } : defaultGeneral;
    const shippingMethods = shippingDoc ? shippingDoc.value : defaultShipping;

    // Store config changes rarely — cache 60s on CDN (5min stale-while-revalidate).
    // Fetched by the settings-context on every client session, so this is high-traffic.
    return cachedJson({ ...general, shippingMethods }, 60, 300);
  } catch (error: any) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      storeName,
      supportEmail,
      taxRate,
      currency,
      currencySymbol,
      defaultReturnDays,
      shippingMethods,
      razorpayEnabled,
      codEnabled,
    } = body;

    if (razorpayEnabled === false && codEnabled === false) {
      return NextResponse.json(
        { error: "At least one payment method must be enabled." },
        { status: 400 },
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error("Database offline");
    }

    await Promise.all([
      Settings.findOneAndUpdate(
        { key: "general" },
        {
          value: {
            storeName: storeName || defaultGeneral.storeName,
            supportEmail: supportEmail || defaultGeneral.supportEmail,
            taxRate: typeof taxRate === "number" ? taxRate : defaultGeneral.taxRate,
            currency: currency || defaultGeneral.currency,
            currencySymbol: currencySymbol || defaultGeneral.currencySymbol,
            defaultReturnDays:
              typeof defaultReturnDays === "number"
                ? defaultReturnDays
                : defaultGeneral.defaultReturnDays,
            razorpayEnabled:
              typeof razorpayEnabled === "boolean"
                ? razorpayEnabled
                : defaultGeneral.razorpayEnabled,
            codEnabled: typeof codEnabled === "boolean" ? codEnabled : defaultGeneral.codEnabled,
          },
        },
        { upsert: true, new: true },
      ),
      Settings.findOneAndUpdate(
        { key: "shipping_methods" },
        { value: shippingMethods || defaultShipping },
        { upsert: true, new: true },
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save settings" },
      { status: 500 },
    );
  }
}
