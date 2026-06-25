import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || SMTP_USER || "care@cosstechcom.com";

// Setup transporter
function getTransporter() {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("SMTP configuration is missing. Emails will not be sent.");
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * Sends a welcome email to a new subscriber
 */
export async function sendWelcomeEmail(toEmail: string, name: string) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const mailOptions = {
    from: `"CosstechCom" <${SUPPORT_EMAIL}>`,
    to: toEmail,
    subject: "Welcome to CosstechCom Club — CosstechCom",
    html: `
      <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #E4E4E7; background-color: #FAF9F6; color: #1C1917;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-size: 28px; margin: 0; color: #1C1917; letter-spacing: 0.05em; text-transform: uppercase;">CosstechCom</h2>
          <p style="font-size: 10px; text-transform: uppercase; tracking-spacing: 0.2em; color: #8C6D58; margin-top: 5px; font-weight: bold;">Multi-Vendor Marketplace</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #E4E4E7; margin-bottom: 35px;" />
        
        <p style="font-size: 15px; line-height: 1.6; color: #27272A;">Dear ${name},</p>
        <p style="font-size: 15px; line-height: 1.6; color: #27272A;">Thank you for subscribing to <strong>The CosstechCom Club</strong>.</p>
        <p style="font-size: 15px; line-height: 1.6; color: #27272A;">We are delighted to welcome you. We look forward to sharing our latest product updates, trending collections, and exclusive member discount alerts directly from CosstechCom.</p>
        
        <div style="margin: 40px 0; text-align: center;">
          <a href="${process.env.NEXTAUTH_URL || "https://cosstechcom.com"}/shop" style="background-color: #1C1917; color: #FAF9F6; text-decoration: none; padding: 12px 28px; border-radius: 20px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">
            Explore The Catalog
          </a>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #27272A;">As a thank you, keep an eye out for our exclusive upcoming drops and special member-only offers.</p>
        
        <hr style="border: 0; border-top: 1px solid #E4E4E7; margin: 35px 0 20px 0;" />
        <div style="text-align: center; font-size: 11px; color: #71717A;">
          <p style="margin: 0 0 5px 0;">CosstechCom Headquarters, Tech Park, Jaipur, Rajasthan, India</p>
          <p style="margin: 0;">You received this email because you subscribed to our newsletter on our website. <a href="${process.env.NEXTAUTH_URL || "https://cosstechcom.com"}/api/newsletter/unsubscribe?email=${encodeURIComponent(toEmail)}" style="color: #8C6D58; text-decoration: underline;">Unsubscribe</a></p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
}

/**
 * Sends a general newsletter blast email to a subscriber
 */
export async function sendNewsletterEmail(toEmail: string, subject: string, htmlContent: string) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const mailOptions = {
    from: `"CosstechCom" <${SUPPORT_EMAIL}>`,
    to: toEmail,
    subject: subject,
    html: `
      <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #E4E4E7; background-color: #FAF9F6; color: #1C1917;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-size: 28px; margin: 0; color: #1C1917; letter-spacing: 0.05em; text-transform: uppercase;">CosstechCom</h2>
          <p style="font-size: 10px; text-transform: uppercase; tracking-spacing: 0.2em; color: #8C6D58; margin-top: 5px; font-weight: bold;">Multi-Vendor Marketplace</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #E4E4E7; margin-bottom: 35px;" />
        
        <div style="font-size: 15px; line-height: 1.6; color: #27272A; text-align: left;">
          ${htmlContent}
        </div>
        
        <hr style="border: 0; border-top: 1px solid #E4E4E7; margin: 35px 0 20px 0;" />
        <div style="text-align: center; font-size: 11px; color: #71717A;">
          <p style="margin: 0 0 5px 0;">CosstechCom Headquarters, Tech Park, Jaipur, Rajasthan, India</p>
          <p style="margin: 0;">If you wish to unsubscribe, please <a href="${process.env.NEXTAUTH_URL || "https://cosstechcom.com"}/api/newsletter/unsubscribe?email=${encodeURIComponent(toEmail)}" style="color: #8C6D58; text-decoration: underline;">click here</a>.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error(`Failed to send newsletter email to ${toEmail}:`, error);
    return false;
  }
}

/**
 * Sends an order confirmation email to the customer
 */
export async function sendOrderConfirmationEmail(toEmail: string, order: any) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const { orderId, items, pricing, shippingAddress } = order;

  const itemsHtml = items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #E4E4E7;">
        <p style="font-size: 14px; font-weight: bold; margin: 0; color: #1C1917;">${item.name}</p>
        <p style="font-size: 12px; color: #71717A; margin: 3px 0 0 0;">Size: ${item.size} · Color: ${item.color} · Qty: ${item.qty}</p>
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #E4E4E7; text-align: right; font-size: 14px; font-weight: bold; color: #1C1917;">
        ₹${item.price * item.qty}
      </td>
    </tr>
  `,
    )
    .join("");

  const mailOptions = {
    from: `"CosstechCom" <${SUPPORT_EMAIL}>`,
    to: toEmail,
    subject: `Order Confirmed — ${orderId} — CosstechCom`,
    html: `
      <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #E4E4E7; background-color: #FAF9F6; color: #1C1917;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-size: 28px; margin: 0; color: #1C1917; letter-spacing: 0.05em; text-transform: uppercase;">CosstechCom</h2>
          <p style="font-size: 10px; text-transform: uppercase; tracking-spacing: 0.2em; color: #8C6D58; margin-top: 5px; font-weight: bold;">Multi-Vendor Marketplace</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #E4E4E7; margin-bottom: 25px;" />
        
        <p style="font-size: 15px; line-height: 1.6; color: #27272A;">Dear Customer,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #27272A;">Thank you for your order! Your order <strong>${orderId}</strong> has been received and is currently being processed.</p>
        
        <h3 style="font-size: 16px; margin: 30px 0 10px 0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #1C1917; padding-bottom: 5px; color: #1C1917;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding-bottom: 10px; border-bottom: 1px solid #E4E4E7; font-size: 12px; text-transform: uppercase; color: #71717A;">Item</th>
              <th style="text-align: right; padding-bottom: 10px; border-bottom: 1px solid #E4E4E7; font-size: 12px; text-transform: uppercase; color: #71717A;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <table style="width: 100%; margin-top: 20px; font-size: 14px; color: #27272A;">
          <tr>
            <td style="padding: 5px 0;">Subtotal</td>
            <td style="text-align: right; padding: 5px 0;">₹${pricing.subtotal}</td>
          </tr>
          ${
            pricing.couponDiscount
              ? `
          <tr>
            <td style="padding: 5px 0; color: #16A34A;">Coupon Discount</td>
            <td style="text-align: right; padding: 5px 0; color: #16A34A;">-₹${pricing.couponDiscount}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 5px 0;">Shipping</td>
            <td style="text-align: right; padding: 5px 0;">${pricing.shipping === 0 ? "FREE" : `₹${pricing.shipping}`}</td>
          </tr>
          ${(() => {
            const tax =
              pricing.total - (pricing.subtotal - (pricing.couponDiscount || 0)) - pricing.shipping;
            return tax > 0
              ? `
          <tr>
            <td style="padding: 5px 0;">Tax</td>
            <td style="text-align: right; padding: 5px 0;">₹${tax}</td>
          </tr>`
              : "";
          })()}
          <tr>
            <td style="padding: 5px 0; font-weight: bold; border-top: 1px solid #E4E4E7; padding-top: 10px;">Total Amount</td>
            <td style="text-align: right; font-weight: bold; border-top: 1px solid #E4E4E7; padding-top: 10px; font-size: 16px; color: #1C1917;">₹${pricing.total}</td>
          </tr>
        </table>

        <div style="margin: 30px 0; padding: 15px; border: 1px solid #E4E4E7; border-radius: 10px; background-color: #FFFFFF;">
          <h4 style="margin: 0 0 8px 0; text-transform: uppercase; font-size: 12px; tracking: 0.05em; color: #8C6D58;">Shipping Details</h4>
          <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #27272A;">
            <strong>${shippingAddress.fullName}</strong><br />
            ${shippingAddress.line1}${shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}<br />
            ${shippingAddress.city}, ${shippingAddress.state} — ${shippingAddress.pin}<br />
            Phone: ${shippingAddress.phone}
          </p>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${process.env.NEXTAUTH_URL || "https://cosstechcom.com"}/account/orders" style="background-color: #1C1917; color: #FAF9F6; text-decoration: none; padding: 12px 28px; border-radius: 20px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">
            Track Your Order
          </a>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #71717A; text-align: center;">If you have any questions, reply to this email or contact our support at ${SUPPORT_EMAIL}</p>
        
        <hr style="border: 0; border-top: 1px solid #E4E4E7; margin: 30px 0 20px 0;" />
        <div style="text-align: center; font-size: 11px; color: #71717A;">
          <p style="margin: 0 0 5px 0;">CosstechCom Headquarters, Tech Park, Jaipur, Rajasthan, India</p>
          <p style="margin: 0;">This email is sent automatically to confirm your purchase.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Order confirmation email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error(`Failed to send order confirmation email for ${orderId}:`, error);
    return false;
  }
}

/**
 * Sends an order status update email to the customer
 */
export async function sendOrderStatusEmail(
  toEmail: string,
  order: any,
  newStatus: string,
  note?: string,
) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const { orderId, shippingAddress } = order;

  const statusLabels: Record<string, string> = {
    CONFIRMED: "Confirmed & Processing",
    PACKED: "Packed & Ready to Dispatch",
    SHIPPED: "Shipped & Out for Transit",
    DELIVERED: "Successfully Delivered",
    CANCELLED: "Cancelled",
    RETURNED: "Returned",
    REFUNDED: "Refund Completed",
  };

  const statusHeadline = statusLabels[newStatus] || newStatus;

  const mailOptions = {
    from: `"CosstechCom" <${SUPPORT_EMAIL}>`,
    to: toEmail,
    subject: `Order Status Update: ${statusHeadline} — ${orderId}`,
    html: `
      <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #E4E4E7; background-color: #FAF9F6; color: #1C1917;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-size: 28px; margin: 0; color: #1C1917; letter-spacing: 0.05em; text-transform: uppercase;">CosstechCom</h2>
          <p style="font-size: 10px; text-transform: uppercase; tracking-spacing: 0.2em; color: #8C6D58; margin-top: 5px; font-weight: bold;">Multi-Vendor Marketplace</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #E4E4E7; margin-bottom: 25px;" />
        
        <p style="font-size: 15px; line-height: 1.6; color: #27272A;">Dear ${shippingAddress?.fullName || "Customer"},</p>
        <p style="font-size: 15px; line-height: 1.6; color: #27272A;">The status of your order <strong>${orderId}</strong> has been updated to:</p>
        
        <div style="margin: 25px 0; padding: 15px; border-left: 4px solid #8C6D58; background-color: #FFFFFF; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1C1917;">${statusHeadline}</p>
          ${note ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #71717A; line-height: 1.4;">${note}</p>` : ""}
        </div>

        <p style="font-size: 14px; line-height: 1.5; color: #27272A;">You can view detailed shipment logs or manage your order anytime in your account panel.</p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${process.env.NEXTAUTH_URL || "https://cosstechcom.com"}/account/orders" style="background-color: #1C1917; color: #FAF9F6; text-decoration: none; padding: 12px 28px; border-radius: 20px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">
            Track Your Order
          </a>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #71717A; text-align: center;">If you have any questions, reply to this email or contact our support at ${SUPPORT_EMAIL}</p>
        
        <hr style="border: 0; border-top: 1px solid #E4E4E7; margin: 30px 0 20px 0;" />
        <div style="text-align: center; font-size: 11px; color: #71717A;">
          <p style="margin: 0 0 5px 0;">CosstechCom Headquarters, Tech Park, Jaipur, Rajasthan, India</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Order status update email sent for ${orderId}:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`Failed to send order status email for ${orderId}:`, error);
    return false;
  }
}

/**
 * Sends a recovery email for an abandoned cart
 */
export async function sendAbandonedCartEmail(toEmail: string, name: string, items: any[]) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const itemsHtml = items
    .map(
      (item) => `
      <div style="display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #E4E4E7;">
        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #E4E4E7; margin-right: 15px;" />
        <div style="flex: 1; text-align: left;">
          <h4 style="margin: 0; font-size: 14px; color: #1C1917;">${item.name}</h4>
          <p style="margin: 3px 0 0 0; font-size: 11px; color: #71717A;">
            Size: ${item.size} &middot; Color: ${item.color} &middot; Qty: ${item.quantity}
          </p>
        </div>
        <div style="margin-left: auto; font-weight: bold; font-size: 14px; color: #8C6D58; min-width: 80px; text-align: right;">
          ₹${new Intl.NumberFormat("en-IN").format(item.price * item.quantity)}
        </div>
      </div>
    `,
    )
    .join("");

  const mailOptions = {
    from: `"CosstechCom" <${SUPPORT_EMAIL}>`,
    to: toEmail,
    subject: "Still thinking about these items? — CosstechCom",
    html: `
      <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #E4E4E7; background-color: #FAF9F6; color: #1C1917;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-size: 28px; margin: 0; color: #1C1917; letter-spacing: 0.05em; text-transform: uppercase;">CosstechCom</h2>
          <p style="font-size: 10px; text-transform: uppercase; tracking-spacing: 0.2em; color: #8C6D58; margin-top: 5px; font-weight: bold;">Multi-Vendor Marketplace</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #E4E4E7; margin-bottom: 25px;" />
        
        <p style="font-size: 15px; line-height: 1.6; color: #27272A;">Dear ${name || "Customer"},</p>
        <p style="font-size: 15px; line-height: 1.6; color: #27272A;">We noticed you left some beautiful items in your shopping bag. They are still reserved for you, but popular items sell out quickly!</p>
        
        <div style="margin: 25px 0; padding: 20px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E4E4E7;">
          <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #8C6D58; text-align: left;">Your Shopping Bag</h3>
          ${itemsHtml}
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${process.env.NEXTAUTH_URL || "https://cosstechcom.com"}/checkout" style="background-color: #1C1917; color: #FAF9F6; text-decoration: none; padding: 12px 28px; border-radius: 20px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">
            Complete Your Checkout
          </a>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #71717A; text-align: center;">Need assistance? Just reply to this email or contact support at ${SUPPORT_EMAIL}</p>
        
        <hr style="border: 0; border-top: 1px solid #E4E4E7; margin: 30px 0 20px 0;" />
        <div style="text-align: center; font-size: 11px; color: #71717A;">
          <p style="margin: 0 0 5px 0;">CosstechCom Headquarters, Tech Park, Jaipur, Rajasthan, India</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Abandoned cart recovery email sent to ${toEmail}:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`Failed to send abandoned cart recovery email to ${toEmail}:`, error);
    return false;
  }
}
