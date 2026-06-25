/**
 * Shiprocket API Client integration with fallback simulation mode.
 */

interface ShiprocketCredentials {
  email?: string;
  password?: string;
  token?: string;
}

const creds: ShiprocketCredentials = {
  email: process.env.SHIPROCKET_EMAIL,
  password: process.env.SHIPROCKET_PASSWORD,
};

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Get active Shiprocket API token, fetching a new one if expired.
 */
async function getShiprocketToken(): Promise<string | null> {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!creds.email || !creds.password) {
    return null; // Missing credentials, will run in mock mode
  }

  try {
    const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: creds.email, password: creds.password }),
    });

    if (!res.ok) {
      console.warn("Shiprocket auth failed. Falling back to Simulation Mode.");
      return null;
    }

    const data = await res.json();
    cachedToken = data.token;
    // Set token expiry (valid for 10 days, let's refresh after 9 days)
    tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
    return cachedToken;
  } catch (err) {
    console.error("Failed to authenticate with Shiprocket:", err);
    return null;
  }
}

/**
 * Checks pincode serviceability and calculates rates.
 */
export async function checkServiceability(
  pickupPincode: string,
  deliveryPincode: string,
  weight: number = 0.5 // weight in kg
): Promise<{ serviceable: boolean; rate?: number; estimatedDays?: number; carrier?: string; error?: string }> {
  const token = await getShiprocketToken();
  if (!token) {
    // SIMULATION MODE
    const isServiceable = /^\d{6}$/.test(deliveryPincode) && !deliveryPincode.startsWith("9");
    if (!isServiceable) {
      return { serviceable: false, error: "Pincode not serviceable by our delivery network" };
    }
    // Generate deterministic rate based on pincode difference
    const rate = Math.round(40 + (Math.abs(Number(pickupPincode) - Number(deliveryPincode)) % 150));
    const estimatedDays = Math.max(2, Math.round(2 + (Math.abs(Number(pickupPincode) - Number(deliveryPincode)) % 5)));

    return {
      serviceable: true,
      rate,
      estimatedDays,
      carrier: "Delhivery (Simulated)",
    };
  }

  try {
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=1`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error("Shiprocket serviceability API failed");
    }

    const data = await res.json();
    if (data.status === 200 && data.data?.available_courier_companies?.length > 0) {
      const bestCourier = data.data.available_courier_companies[0];
      return {
        serviceable: true,
        rate: Number(bestCourier.rate),
        estimatedDays: Number(bestCourier.etd_hours) / 24,
        carrier: bestCourier.courier_name,
      };
    }

    return { serviceable: false, error: "No shipping partners service this destination PIN code" };
  } catch (err: any) {
    console.error("Shiprocket checkServiceability error:", err);
    return { serviceable: false, error: err.message || "Failed to check serviceability" };
  }
}

/**
 * Creates a shipment order on Shiprocket.
 */
export async function createShipmentOrder(
  subOrder: any,
  vendorProfile: any,
  shippingAddress: any
): Promise<{ success: boolean; shipmentId?: string; rate?: number; error?: string }> {
  const token = await getShiprocketToken();
  if (!token) {
    // SIMULATION MODE
    console.log(`[Shiprocket Simulation] Creating shipment order for sub-order ${subOrder.subOrderId}`);
    const simulatedShipmentId = `SR_SIM_${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      success: true,
      shipmentId: simulatedShipmentId,
      rate: subOrder.pricing?.shippingCost || 60,
    };
  }

  try {
    const orderItems = subOrder.items.map((item: any) => ({
      name: item.name,
      sku: item.sku || `SKU-${item.productId}`,
      units: item.qty,
      selling_price: item.price,
    }));

    const payload = {
      order_id: subOrder.subOrderId,
      order_date: new Date(subOrder.createdAt || Date.now()).toISOString().split("T")[0],
      pickup_location: vendorProfile.storeName.substring(0, 30),
      billing_customer_name: shippingAddress.fullName.split(" ")[0] || "Customer",
      billing_last_name: shippingAddress.fullName.split(" ")[1] || "Lastname",
      billing_address: shippingAddress.line1,
      billing_address_2: shippingAddress.line2 || "",
      billing_city: shippingAddress.city,
      billing_pincode: shippingAddress.pin,
      billing_state: shippingAddress.state,
      billing_country: "India",
      billing_email: "care@cosstechcom.com",
      billing_phone: shippingAddress.phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: subOrder.paymentMethod === "COD" ? "COD" : "Prepaid",
      sub_total: subOrder.pricing?.subtotal || 0,
      length: 15,
      width: 15,
      height: 15,
      weight: 0.5,
    };

    const res = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Failed to create Shiprocket shipment order");
    }

    const data = await res.json();
    return {
      success: true,
      shipmentId: String(data.shipment_id),
      rate: Number(data.rate || 0),
    };
  } catch (err: any) {
    console.error("Shiprocket createShipmentOrder error:", err);
    return { success: false, error: err.message || "Shipment creation failed" };
  }
}

/**
 * Generates and assigns AWB for a shipment.
 */
export async function generateAwb(
  shipmentId: string
): Promise<{ success: boolean; awbNumber?: string; courierName?: string; error?: string }> {
  const token = await getShiprocketToken();
  if (!token) {
    // SIMULATION MODE
    const simulatedAwb = `AWB${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    return {
      success: true,
      awbNumber: simulatedAwb,
      courierName: "Delhivery (Simulated)",
    };
  }

  try {
    const res = await fetch("https://apiv2.shiprocket.in/v1/external/courier/assign/awb", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ shipment_id: shipmentId }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "AWB generation failed");
    }

    const data = await res.json();
    if (data.status === 200 && data.response?.data?.awb_code) {
      return {
        success: true,
        awbNumber: data.response.data.awb_code,
        courierName: data.response.data.courier_name,
      };
    }

    return { success: false, error: "Failed to allocate AWB code from courier" };
  } catch (err: any) {
    console.error("Shiprocket generateAwb error:", err);
    return { success: false, error: err.message || "Failed to assign AWB" };
  }
}

/**
 * Schedules a pickup request.
 */
export async function requestPickup(
  shipmentId: string
): Promise<{ success: boolean; pickupDate?: string; error?: string }> {
  const token = await getShiprocketToken();
  if (!token) {
    // SIMULATION MODE
    return {
      success: true,
      pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    };
  }

  try {
    const res = await fetch("https://apiv2.shiprocket.in/v1/external/courier/generate/pickup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ shipment_id: [shipmentId] }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Pickup generation failed");
    }

    const data = await res.json();
    return {
      success: true,
      pickupDate: data.response?.pickup_date || "",
    };
  } catch (err: any) {
    console.error("Shiprocket requestPickup error:", err);
    return { success: false, error: err.message || "Failed to schedule pickup" };
  }
}

/**
 * Fetch tracking details by AWB code.
 */
export async function getTrackingDetails(
  awbNumber: string
): Promise<{ success: boolean; status?: string; activity?: string; error?: string }> {
  const token = await getShiprocketToken();
  if (!token) {
    // SIMULATION MODE
    return {
      success: true,
      status: "SHIPPED",
      activity: "In Transit - Out for delivery in target location.",
    };
  }

  try {
    const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbNumber}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch tracking details");
    }

    const data = await res.json();
    const track = data.tracking_data;
    if (track && track.track_status === 1) {
      return {
        success: true,
        status: track.shipment_status,
        activity: track.shipment_track_activities?.[0]?.activity || "No activity logged",
      };
    }

    return { success: false, error: "Tracking data unavailable" };
  } catch (err: any) {
    console.error("Shiprocket getTrackingDetails error:", err);
    return { success: false, error: err.message || "Failed to retrieve tracking details" };
  }
}
