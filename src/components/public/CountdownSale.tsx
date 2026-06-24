"use client";

import React, { useState, useEffect } from "react";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { Flame } from "lucide-react";

interface CountdownSaleProps {
  sale: {
    _id: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
    endTime: string;
    products: any[];
  } | null;
}

export function CountdownSale({ sale }: CountdownSaleProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!sale) return;

    const end = new Date(sale.endTime).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        return;
      }

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sale]);

  if (!sale || !sale.products || sale.products.length === 0 || timeLeft === "EXPIRED") {
    return null;
  }

  // Format products to include flash sale price and discount details
  const productsWithDiscounts = sale.products.map((p) => {
    let salePrice = p.salePrice;
    if (sale.discountType === "PERCENTAGE") {
      salePrice = Math.round(p.salePrice * (1 - sale.discountValue / 100));
    } else if (sale.discountType === "FLAT") {
      salePrice = Math.max(0, p.salePrice - sale.discountValue);
    }
    return {
      ...p,
      salePrice,
      compareAtPrice: p.salePrice,
      discount: sale.discountType === "PERCENTAGE" ? sale.discountValue : Math.round(((p.price - salePrice) / p.price) * 100),
    };
  });

  return (
    <section className="bg-gradient-to-r from-red-500/10 via-orange-500/5 to-transparent border-y border-red-500/15 py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-red-500 flex items-center justify-center animate-bounce">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                Flash Deals
                <span className="text-xs uppercase bg-red-500 text-white font-bold px-2 py-0.5 rounded tracking-wide animate-pulse">Live</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Premium products at unbeatable prices. Limited stock!</p>
            </div>
          </div>

          {/* Countdown timer box */}
          <div className="flex items-center gap-2 bg-charcoal text-cream font-mono text-sm md:text-lg font-bold px-4 py-2 rounded-xl shadow-lg border border-border/10 self-start md:self-auto">
            <span className="text-[10px] uppercase font-sans tracking-widest text-muted-foreground/60 mr-2">Ends In</span>
            <span className="text-red-400 select-none animate-pulse">{timeLeft}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {productsWithDiscounts.slice(0, 4).map((p, idx) => (
            <ProductCard key={p.id} product={p} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
