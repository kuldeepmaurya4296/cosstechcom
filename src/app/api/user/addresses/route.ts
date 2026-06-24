import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database offline" }, { status: 500 });
    }

    const user = await User.findById(session.user.id).select("addresses").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.addresses || []);
  } catch (error: any) {
    console.error("Addresses GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch addresses" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database offline" }, { status: 500 });
    }

    const body = await request.json();
    const { label, fullName, phone, line1, line2, city, state, pin, isDefault } = body;

    if (!label || !fullName || !phone || !line1 || !city || !state || !pin) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If marked default, reset other defaults
    if (isDefault || user.addresses.length === 0) {
      user.addresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      label,
      fullName,
      phone,
      line1,
      line2: line2 || "",
      city,
      state,
      pin,
      isDefault: isDefault || user.addresses.length === 0,
    };

    user.addresses.push(newAddress);
    await user.save();

    return NextResponse.json(user.addresses);
  } catch (error: any) {
    console.error("Addresses POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to add address" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database offline" }, { status: 500 });
    }

    const body = await request.json();
    const { id, label, fullName, phone, line1, line2, city, state, pin, isDefault } = body;

    if (!id || !label || !fullName || !phone || !line1 || !city || !state || !pin) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const address = user.addresses.id(id);
    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // If this address is set to default, set all others to false
    if (isDefault) {
      user.addresses.forEach((addr: any) => {
        if (addr._id.toString() !== id) {
          addr.isDefault = false;
        }
      });
    }

    address.label = label;
    address.fullName = fullName;
    address.phone = phone;
    address.line1 = line1;
    address.line2 = line2 || "";
    address.city = city;
    address.state = state;
    address.pin = pin;
    address.isDefault = isDefault;

    await user.save();

    return NextResponse.json(user.addresses);
  } catch (error: any) {
    console.error("Addresses PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update address" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database offline" }, { status: 500 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const addressToDelete = user.addresses.id(id);
    if (!addressToDelete) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const wasDefault = addressToDelete.isDefault;
    user.addresses.pull(id);

    // If we deleted the default address, make the first remaining address the default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return NextResponse.json(user.addresses);
  } catch (error: any) {
    console.error("Addresses DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete address" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
