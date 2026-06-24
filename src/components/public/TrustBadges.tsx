import { Truck, RotateCcw, ShieldCheck } from "lucide-react";

export function TrustBadges() {
  const items = [
    { icon: Truck, label: "Free Shipping" },
    { icon: RotateCcw, label: "30-Day Returns" },
    { icon: ShieldCheck, label: "1-Yr Warranty" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 pt-4">
      {items.map(({ icon: Icon, label }, i) => (
        <div
          key={i}
          className="bg-cream/40 border border-border/50 rounded-xl p-3 text-center flex flex-col items-center justify-center transition-all duration-350 hover:bg-cream/70 hover:shadow-xs"
        >
          <Icon className="h-4.5 w-4.5 text-cognac mb-1 shrink-0" />
          <p className="text-[10px] font-bold text-charcoal uppercase tracking-wider">{label}</p>
        </div>
      ))}
    </div>
  );
}
