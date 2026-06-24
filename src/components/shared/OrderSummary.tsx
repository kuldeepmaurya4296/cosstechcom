import { formatINR } from "@/lib/format";

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  taxRate?: number;
  couponDiscount?: number;
  couponCode?: string;
  pointsDiscount?: number;
  actionButton?: React.ReactNode;
}

export function OrderSummary({
  subtotal,
  shipping,
  tax,
  taxRate = 8,
  couponDiscount = 0,
  couponCode,
  pointsDiscount = 0,
  actionButton,
}: OrderSummaryProps) {
  const cgst = Math.round(tax / 2);
  const sgst = tax - cgst;
  const halfRate = taxRate / 2;
  const finalTotal = Math.max(0, subtotal + shipping + tax - couponDiscount - pointsDiscount);

  return (
    <div className="bg-card/70 backdrop-blur-md border border-border/80 rounded-2xl p-6 space-y-5 shadow-md sticky top-28">
      <h2 className="font-serif text-xl font-bold text-charcoal border-b border-border/40 pb-3">
        Order Summary
      </h2>
      <div className="space-y-3 text-xs md:text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground font-medium">Subtotal</span>
          <span className="font-semibold text-charcoal">{formatINR(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground font-medium">Shipping</span>
          <span className="font-semibold text-charcoal">
            {shipping === 0 ? "Free" : formatINR(shipping)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground font-medium">CGST ({halfRate}%)</span>
          <span className="font-semibold text-charcoal">{formatINR(cgst)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground font-medium">SGST ({halfRate}%)</span>
          <span className="font-semibold text-charcoal">{formatINR(sgst)}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600 font-bold bg-green-50/50 px-2.5 py-1.5 rounded-xl border border-green-200/50">
            <span>Discount {couponCode ? `(${couponCode})` : ""}</span>
            <span>-{formatINR(couponDiscount)}</span>
          </div>
        )}
        {pointsDiscount > 0 && (
          <div className="flex justify-between text-amber-600 font-bold bg-amber-50/50 px-2.5 py-1.5 rounded-xl border border-amber-200/50">
            <span>Loyalty Points Discount</span>
            <span>-{formatINR(pointsDiscount)}</span>
          </div>
        )}
      </div>
      <div className="border-t border-border/40 pt-4 flex justify-between items-baseline font-bold text-charcoal">
        <span className="text-sm">Total Amount</span>
        <span className="font-serif text-2xl text-cognac">{formatINR(finalTotal)}</span>
      </div>
      {actionButton}
    </div>
  );
}
