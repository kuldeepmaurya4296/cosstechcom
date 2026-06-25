import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "vendor")) {
      return new Response("Unauthorized. Administrative privileges required.", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idsString = searchParams.get("ids") || "";
    if (!idsString) {
      return new Response("Error: Missing order ids in parameters", { status: 400 });
    }

    const orderIds = idsString
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    await connectToDatabase();
    const orders = await Order.find({ orderId: { $in: orderIds } })
      .populate({ path: "userId", model: User, select: "name email" })
      .lean();

    if (orders.length === 0) {
      return new Response("Error: No matching orders found in database.", { status: 404 });
    }

    const labelsHtml = orders
      .map((order: any) => {
        const isCod = order.payment?.method === "COD";
        const totalAmount = order.pricing?.total || 0;

        return `
        <div class="label-page">
          <!-- Header -->
          <div class="header">
            <div class="store-info">
              <h2 class="store-name">COSSTECHCOM</h2>
              <p class="store-sub">Ultimate Multi-Vendor E-Commerce Portal</p>
            </div>
            <div class="qr-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${order.orderId}" alt="Order QR" class="qr-code" />
            </div>
          </div>
          
          <div class="divider"></div>
          
          <!-- Order Meta -->
          <div class="meta-row">
            <div>
              <p class="meta-label">ORDER ID</p>
              <p class="meta-value font-mono">${order.orderId}</p>
            </div>
            <div class="text-right">
              <p class="meta-label">DATE</p>
              <p class="meta-value">${new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <!-- Shipping Address -->
          <div class="shipping-section">
            <p class="section-title">SHIP TO:</p>
            <p class="customer-name">${order.shippingAddress.fullName}</p>
            <p class="address-line">${order.shippingAddress.line1}</p>
            ${order.shippingAddress.line2 ? `<p class="address-line">${order.shippingAddress.line2}</p>` : ""}
            <p class="address-line font-bold">${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pin}</p>
            <p class="phone-line"><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
          </div>
          
          <div class="divider"></div>
          
          <!-- Items Summary -->
          <div class="items-section">
            <table class="items-table">
              <thead>
                <tr>
                  <th class="text-left">Item Desc</th>
                  <th class="text-center">Size</th>
                  <th class="text-center">Color</th>
                  <th class="text-center">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item: any) => `
                  <tr>
                    <td>${item.name}</td>
                    <td class="text-center">${item.size}</td>
                    <td class="text-center">${item.color}</td>
                    <td class="text-center">x${item.qty || item.quantity}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          
          <!-- COD/Prepaid Badge Banner -->
          <div class="payment-banner ${isCod ? "cod-banner" : "prepaid-banner"}">
            ${
              isCod
                ? `CASH ON DELIVERY (COD)<br/><span class="collect-amount">COLLECT CASH: ₹${totalAmount}</span>`
                : `PREPAID ORDER<br/><span class="collect-amount">DO NOT COLLECT CASH</span>`
            }
          </div>
        </div>
      `;
      })
      .join("\n");

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipping Labels — CosstechCom</title>
          <style>
            body {
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #f3f4f6;
              color: #111827;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .label-page {
              background-color: #ffffff;
              width: 4in;
              height: 6in;
              box-sizing: border-box;
              padding: 0.25in;
              margin: 20px auto;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              display: flex;
              flex-direction: column;
              border: 2px solid #000000;
              position: relative;
              overflow: hidden;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .store-name {
              margin: 0;
              font-family: Georgia, serif;
              font-size: 18px;
              font-weight: 900;
              letter-spacing: 0.5px;
            }
            .store-sub {
              margin: 2px 0 0 0;
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #4b5563;
              font-weight: bold;
            }
            .qr-code {
              width: 60px;
              height: 60px;
              border: 1px solid #e5e7eb;
              padding: 2px;
            }
            .divider {
              border-top: 1.5px dashed #000000;
              margin: 8px 0;
              width: 100%;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
            }
            .meta-label {
              margin: 0;
              color: #4b5563;
              font-size: 8px;
              font-weight: bold;
            }
            .meta-value {
              margin: 2px 0 0 0;
              font-weight: bold;
              font-size: 13px;
            }
            .font-mono {
              font-family: monospace;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .shipping-section {
              font-size: 12px;
              line-height: 1.4;
              flex-grow: 1;
            }
            .section-title {
              margin: 0 0 4px 0;
              font-size: 9px;
              font-weight: bold;
              color: #4b5563;
            }
            .customer-name {
              margin: 0 0 4px 0;
              font-size: 14px;
              font-weight: bold;
            }
            .address-line {
              margin: 0;
            }
            .phone-line {
              margin: 6px 0 0 0;
            }
            .font-bold {
              font-weight: bold;
            }
            .items-section {
              margin-top: 8px;
              font-size: 10px;
              max-height: 1.2in;
              overflow: hidden;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
            }
            .items-table th {
              border-bottom: 1px solid #000000;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 8px;
              padding-bottom: 2px;
            }
            .items-table td {
              padding: 3px 0;
              border-bottom: 0.5px solid #e5e7eb;
            }
            .payment-banner {
              text-align: center;
              font-weight: bold;
              font-size: 10px;
              padding: 8px;
              border: 2px solid #000000;
              margin-top: auto;
              border-radius: 4px;
            }
            .cod-banner {
              background-color: #000000;
              color: #ffffff;
            }
            .prepaid-banner {
              background-color: #ffffff;
              color: #000000;
            }
            .collect-amount {
              font-size: 14px;
              letter-spacing: 0.5px;
            }
            
            /* Print Overrides */
            @page {
              size: 4in 6in;
              margin: 0;
            }
            @media print {
              body {
                background-color: #ffffff;
              }
              .label-page {
                margin: 0;
                border: none;
                border-radius: 0;
                box-shadow: none;
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    return new Response(fullHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("Failed to generate shipping label:", error);
    return new Response("Failed to generate shipping label: " + error.message, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
