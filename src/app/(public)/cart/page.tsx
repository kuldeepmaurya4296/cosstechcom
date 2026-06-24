"use client";

import Link from "next/link";
import { useCart, lineKey } from "@/lib/cart-store";
import { CartItemRow } from "@/modules/cart/components/CartItemRow";
import { EmptyCartState } from "@/modules/cart/components/EmptyCartState";
import { OrderSummary } from "@/components/shared/OrderSummary";
import { useSettings } from "@/lib/settings-context";
import { ShoppingBag, ArrowRight, Shield, RotateCcw, Truck } from "lucide-react";

const trustBadges = [
  { icon: Shield, label: "Secure Checkout", sub: "256-bit SSL encrypted" },
  { icon: Truck, label: "Free Shipping", sub: "On orders above ₹2,000" },
  { icon: RotateCcw, label: "Easy Returns", sub: "7-day hassle-free policy" },
];

export default function CartPage() {
  const { lines, remove, setQty, subtotal } = useCart();
  const settings = useSettings();
  const shipping = 0;
  const tax = Math.round(subtotal * (settings.taxRate / 100));

  // Group lines by vendor
  const groupedLines: Record<string, typeof lines> = {};
  for (const line of lines) {
    const vName = (line as any).vendorName || "CosstechCom Seller";
    if (!groupedLines[vName]) {
      groupedLines[vName] = [];
    }
    groupedLines[vName].push(line);
  }

  if (lines.length === 0) {
    return <EmptyCartState />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 lg:py-20">
      {/* Page Header */}
      <div className="mb-8 md:mb-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-cognac font-bold mb-2">
          Review &amp; Checkout
        </p>
        <h1 className="font-serif text-3xl md:text-5xl font-bold flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          Your Bag
          <span className="text-lg md:text-2xl font-normal text-muted-foreground">
            ({lines.length} {lines.length === 1 ? "item" : "items"})
          </span>
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">
        {/* Left: Items List */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedLines).map(([vendorName, vendorItems]) => (
            <div key={vendorName} className="space-y-3 bg-muted/10 border border-border/40 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/30 pb-2 mb-3">
                <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Seller:</span>
                <span className="text-xs font-bold text-primary tracking-wide uppercase">{vendorName}</span>
              </div>
              <div className="space-y-4">
                {vendorItems.map((l) => {
                  const k = lineKey(l);
                  return (
                    <CartItemRow key={k} item={l} lineKey={k} onRemove={remove} onQtyChange={setQty} />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Continue Shopping Link */}
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-semibold group"
            >
              <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
              Continue Shopping
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-border/50">
            {trustBadges.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center gap-1.5 p-3 bg-muted/50 rounded-xl border border-border/40"
              >
                <Icon className="h-4 w-4 text-cognac" />
                <span className="text-[11px] font-bold text-foreground/80">{label}</span>
                <span className="text-[10px] text-muted-foreground leading-tight hidden md:block">
                  {sub}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Order Summary Sticky Sidebar */}
        <aside className="h-fit sticky top-24 pb-8 lg:pb-0">
          <OrderSummary
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            taxRate={settings.taxRate}
            actionButton={
              <div className="space-y-3">
                <Link
                  href="/checkout"
                  className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground rounded-full py-3.5 font-semibold hover:opacity-95 transition shadow-md text-sm"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/shop"
                  className="block text-center text-xs text-muted-foreground hover:text-primary transition font-medium underline underline-offset-2"
                >
                  Continue Shopping
                </Link>
              </div>
            }
          />
        </aside>
      </div>
    </div>
  );
}
