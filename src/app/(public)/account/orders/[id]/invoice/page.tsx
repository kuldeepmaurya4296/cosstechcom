import React from "react";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/models/Order";
import SubOrder from "@/lib/models/SubOrder";
import VendorProfile from "@/lib/models/VendorProfile";
import Settings from "@/lib/models/Settings";
import Invoice from "@/lib/models/Invoice";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { formatINR, formatDate } from "@/lib/format";
import { InvoiceActions } from "./InvoiceActions";
import { FileText, ShieldCheck, MapPin, Calendar, Receipt } from "lucide-react";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subOrderId?: string }>;
}) {
  const { id } = await params;
  const { subOrderId } = await searchParams;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  // Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Connect to DB
  const db = await connectToDatabase();
  if (!db) {
    throw new Error("Database offline");
  }

  const order = await Order.findById(id).lean();
  if (!order) {
    notFound();
  }

  // Check authorization (must be admin, vendor, support, or the customer)
  const isAuthorized =
    session.user.role === "admin" ||
    session.user.role === "support" ||
    session.user.role === "vendor" ||
    session.user.id === order.userId.toString();

  if (!isAuthorized) {
    redirect("/account/orders");
  }

  // Fetch all related sub-orders for mapping vendors/invoices
  const subOrdersList = await SubOrder.find({ parentOrderId: order._id }).lean();
  
  // Fetch vendor profiles represented in the order
  const vendorIds = subOrdersList.map((so: any) => so.vendorId);
  const vendorProfiles = await VendorProfile.find({ userId: { $in: vendorIds } }).lean();

  // Find if we are viewing a specific sub-order invoice
  let currentSubOrder: any = null;
  let currentVendorProfile: any = null;

  if (subOrderId) {
    currentSubOrder = subOrdersList.find(
      (so: any) =>
        so.subOrderId === subOrderId || so._id.toString() === subOrderId
    );
    if (currentSubOrder) {
      currentVendorProfile = vendorProfiles.find(
        (vp: any) => vp.userId.toString() === currentSubOrder.vendorId.toString()
      );
    }
  }

  // Fetch general store settings for fallback/platform invoice
  const generalDoc = (await Settings.findOne({ key: "general" }).lean()) as any;
  const platformName = generalDoc?.value?.storeName || "CosstechCom";
  const platformEmail = generalDoc?.value?.supportEmail || "support@cosstechcom.com";
  const platformPhone = "+91 62636 38053";
  const platformAddress = "CosstechCom Corporate Office, Tech Park Road, Jaipur, Rajasthan, 302001";

  // Determine which seller details to show
  const sellerName = currentVendorProfile?.storeName || platformName;
  const sellerAddress = currentVendorProfile?.businessAddress || platformAddress;
  const sellerPhone = currentVendorProfile ? "" : platformPhone;
  const sellerEmail = currentVendorProfile ? "" : platformEmail;
  const sellerGstin = currentVendorProfile?.gstNumber || "";
  const sellerPan = currentVendorProfile?.panNumber || "";

  // Query saved invoice document if viewing a sub-order
  let dbInvoice: any = null;
  if (currentSubOrder) {
    dbInvoice = await Invoice.findOne({ subOrderId: currentSubOrder._id }).lean();
  }

  // Determine items and invoice number
  const itemsToRender = currentSubOrder ? currentSubOrder.items : order.items;
  const invoiceNumber = dbInvoice
    ? dbInvoice.invoiceNumber
    : currentSubOrder
    ? `INV-SUB-${currentSubOrder.subOrderId}`
    : `INV-${order.orderId || order._id.toString().substring(0, 8).toUpperCase()}`;

  // Determine pricing calculations
  const subtotal = dbInvoice ? dbInvoice.subTotal : currentSubOrder ? currentSubOrder.pricing.subtotal : order.pricing?.subtotal || 0;
  const shipping = currentSubOrder ? currentSubOrder.pricing.shippingCost : order.pricing?.shipping || 0;
  const discount = currentSubOrder ? currentSubOrder.pricing.couponDiscount : order.pricing?.couponDiscount || 0;
  const pointsDiscount = currentSubOrder ? currentSubOrder.pricing.pointsDiscount : order.pricing?.pointsDiscount || 0;
  const total = dbInvoice ? dbInvoice.totalAmount : currentSubOrder ? currentSubOrder.pricing.total : order.pricing?.total || 0;

  // CGST & SGST frozen calculation
  const tax = dbInvoice ? dbInvoice.gstBreakdown.totalTax : currentSubOrder ? currentSubOrder.pricing.tax : order.pricing?.tax || 0;
  const invoiceTaxRate = currentSubOrder ? currentSubOrder.pricing.taxRate : order.pricing?.taxRate || 8;
  const cgst = dbInvoice ? dbInvoice.gstBreakdown.cgst : Math.round((tax / 2) * 100) / 100;
  const sgst = dbInvoice ? dbInvoice.gstBreakdown.sgst : tax - cgst;

  return (
    <div className="min-h-screen bg-neutral-50 py-10 print:bg-white print:py-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body {
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `,
        }}
      />

      <div className="print-container mx-auto max-w-3xl bg-white border border-border/80 rounded-2xl shadow-sm p-8 md:p-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-neutral-100 pb-8">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-charcoal">
              {sellerName}
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
              {sellerAddress}
            </p>
            {(sellerPhone || sellerEmail) && (
              <p className="text-xs text-muted-foreground mt-1">
                {sellerPhone && `Phone: ${sellerPhone}`} {sellerEmail && `| Email: ${sellerEmail}`}
              </p>
            )}
            {sellerGstin && (
              <p className="text-xs text-muted-foreground mt-1">
                GSTIN: <strong className="text-charcoal font-mono">{sellerGstin}</strong>
                {sellerPan && ` | PAN: ${sellerPan}`}
              </p>
            )}
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-charcoal mb-4">
              {currentSubOrder ? "Seller Tax Invoice" : "Order Summary Receipt"}
            </span>
            <p className="text-xs text-muted-foreground">Invoice No:</p>
            <p className="font-mono text-sm font-bold text-charcoal">
              {invoiceNumber}
            </p>
            <p className="text-xs text-muted-foreground mt-2.5">Date:</p>
            <p className="text-xs font-bold text-charcoal">
              {formatDate(order.createdAt.toISOString())}
            </p>
          </div>
        </div>

        {/* Invoice Info Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-neutral-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Bill & Ship To
            </h3>
            <p className="text-sm font-bold text-charcoal">{order.shippingAddress.fullName}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
              {order.shippingAddress.pin}
              <br />
              {order.shippingAddress.country}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Phone: {order.shippingAddress.phone}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Payment details
            </h3>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Payment Method: <strong className="text-charcoal">{order.payment.method}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Payment Status:{" "}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    order.payment.status === "PAID"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {order.payment.status}
                </span>
              </p>
              {order.payment.razorpayPaymentId && (
                <p className="text-xs text-muted-foreground">
                  Transaction Ref:{" "}
                  <code className="bg-neutral-50 px-1 py-0.5 rounded font-mono text-[10px] text-charcoal">
                    {order.payment.razorpayPaymentId}
                  </code>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 w-12">
                  #
                </th>
                <th className="py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Item Description
                </th>
                <th className="py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 text-center w-24">
                  Size/Color
                </th>
                <th className="py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 text-right w-24">
                  Unit Price
                </th>
                <th className="py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 text-center w-16">
                  Qty
                </th>
                <th className="py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 text-right w-28">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {itemsToRender.map((item: any, idx: number) => {
                // Find vendor name if in main order view
                const itemVendorProfile = !currentSubOrder
                  ? vendorProfiles.find((vp: any) => vp.userId.toString() === item.vendorId?.toString())
                  : null;

                return (
                  <tr
                    key={idx}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                  >
                    <td className="py-4 text-xs font-mono text-muted-foreground">{idx + 1}</td>
                    <td className="py-4">
                      <p className="text-xs font-bold text-charcoal">{item.name}</p>
                      {itemVendorProfile && (
                        <p className="text-[10px] text-primary mt-0.5">
                          Seller: {itemVendorProfile.storeName}
                        </p>
                      )}
                    </td>
                    <td className="py-4 text-xs text-center text-muted-foreground">
                      {item.size} / {item.color}
                    </td>
                    <td className="py-4 text-xs text-right text-charcoal font-medium">
                      {formatINR(item.price)}
                    </td>
                    <td className="py-4 text-xs text-center text-charcoal font-bold">{item.qty}</td>
                    <td className="py-4 text-xs text-right text-charcoal font-bold">
                      {formatINR(item.price * item.qty)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="flex justify-end border-t border-neutral-200 pt-6">
          <div className="w-full sm:w-80 space-y-2.5">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-semibold text-charcoal">{formatINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-600 font-medium">
                <span>Coupon Discount {order.coupon?.code ? `(${order.coupon.code})` : ""}:</span>
                <span>-{formatINR(discount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between items-center text-xs text-amber-600 font-medium">
                <span>Loyalty Points Discount:</span>
                <span>-{formatINR(pointsDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>CGST ({invoiceTaxRate / 2}%):</span>
              <span className="font-semibold text-charcoal">{formatINR(cgst)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>SGST ({invoiceTaxRate / 2}%):</span>
              <span className="font-semibold text-charcoal">{formatINR(sgst)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Shipping Fee:</span>
              <span className="font-semibold text-charcoal">{formatINR(shipping)}</span>
            </div>
            <div className="border-t border-neutral-100 my-2 pt-2.5 flex justify-between items-center text-sm font-bold text-charcoal">
              <span className="font-serif">Grand Total:</span>
              <span className="font-serif text-lg text-cognac">{formatINR(total)}</span>
            </div>
          </div>
        </div>

        {/* Case B: Render list of split sub-orders invoices */}
        {!currentSubOrder && subOrdersList.length > 1 && (
          <div className="mt-10 border-t border-neutral-200 pt-8 no-print">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              <span>Seller-Specific Tax Invoices</span>
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              This order was split across multiple marketplace sellers. Tax invoices must be issued by the respective sellers legally. Select a seller to view their split invoice:
            </p>
            <div className="space-y-3">
              {subOrdersList.map((so: any) => {
                const vp = vendorProfiles.find((profile: any) => profile.userId.toString() === so.vendorId.toString());
                return (
                  <div
                    key={so._id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-50/70 p-4 rounded-xl border border-neutral-100 gap-3 hover:bg-neutral-50 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-charcoal">
                        Seller: {vp?.storeName || "Marketplace Vendor"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Invoice Reference: <strong className="font-mono">{so.subOrderId}</strong> ({so.items.length} items)
                      </p>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      <span className="font-bold text-xs text-cognac font-serif">
                        {formatINR(so.pricing.total)}
                      </span>
                      <a
                        href={`/account/orders/${id}/invoice?subOrderId=${so.subOrderId}`}
                        className="text-xs font-bold text-primary hover:text-cognac transition cursor-pointer"
                      >
                        View Invoice &rarr;
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Notes */}
        <div className="mt-16 pt-8 border-t border-neutral-100 text-center space-y-2">
          <p className="text-[10px] text-muted-foreground font-semibold">
            Thank you for stepping into luxury with {currentVendorProfile ? sellerName : platformName}.
          </p>
          <p className="text-[9px] text-neutral-400">
            This is a system generated computer tax invoice and requires no physical signature.
          </p>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <InvoiceActions
        backUrl={currentSubOrder ? `/account/orders/${id}/invoice` : "/account/orders"}
      />
    </div>
  );
}
