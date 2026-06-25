import Link from "next/link";
import { Trash2, Package } from "lucide-react";
import { formatINR } from "@/lib/format";
import { QuantitySelector } from "@/components/shared/QuantitySelector";

interface CartItemRowProps {
  item: {
    productId: string;
    slug: string;
    name: string;
    size: string | number;
    color: string;
    price: number;
    image: string;
    quantity: number;
  };
  lineKey: string;
  onRemove: (key: string) => void;
  onQtyChange: (key: string, qty: number) => void;
}

export function CartItemRow({ item, lineKey, onRemove, onQtyChange }: CartItemRowProps) {
  const lineTotal = item.price * item.quantity;

  return (
    <div className="group bg-card border border-border rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200">
      {/* Product Image */}
      <div className="relative shrink-0">
        <Link href={`/shop/${item.slug}`}>
          <div className="h-24 w-24 md:h-28 md:w-28 rounded-xl overflow-hidden bg-muted border border-border/50">
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <Link
              href={`/shop/${item.slug}`}
              className="font-serif font-semibold text-sm md:text-base hover:text-primary transition-colors leading-snug line-clamp-2 cursor-pointer"
            >
              {item.name}
            </Link>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {(() => {
                const sStr = String(item.size || "").trim();
                if (!sStr) return null;
                const num = Number(sStr);
                const isShoe = !isNaN(num) && num > 0 && num < 20;
                return (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted text-muted-foreground rounded-full border border-border/60">
                    <Package className="h-2.5 w-2.5" />
                    {isShoe ? `UK/IND ${sStr}` : sStr}
                  </span>
                );
              })()}
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted text-muted-foreground rounded-full border border-border/60">
                <span
                  className="h-2 w-2 rounded-full border border-black/15 shrink-0"
                  style={{
                    backgroundColor:
                      item.color?.toLowerCase() === "black"
                        ? "#1a1a1a"
                        : item.color?.toLowerCase() === "brown"
                          ? "#7B4F26"
                          : item.color?.toLowerCase() === "white"
                            ? "#f9f9f7"
                            : item.color?.toLowerCase() === "tan"
                              ? "#C9A96E"
                              : "#888",
                  }}
                />
                {item.color}
              </span>
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(lineKey)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/8 rounded-lg transition-all shrink-0"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Qty + Price Row */}
        <div className="mt-3 flex justify-between items-center gap-4">
          <QuantitySelector
            quantity={item.quantity}
            onChange={(q) => onQtyChange(lineKey, q)}
            size="sm"
          />
          <div className="text-right">
            <div className="font-bold text-sm md:text-base">{formatINR(lineTotal)}</div>
            {item.quantity > 1 && (
              <div className="text-[10px] text-muted-foreground">{formatINR(item.price)} each</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
