"use client";

import React from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { Trash2 } from "lucide-react";

interface RecentlyViewedProps {
  excludeProductId?: string;
  limit?: number;
  title?: string;
  subtitle?: string;
}

export function RecentlyViewed({
  excludeProductId,
  limit = 4,
  title = "Recently Viewed Styles",
  subtitle = "Continue Browsing",
}: RecentlyViewedProps) {
  const { recentlyViewed, clearList } = useRecentlyViewed();

  // Filter out the active product if specified
  const items = recentlyViewed.filter((p) => p.id !== excludeProductId).slice(0, limit);

  if (items.length === 0) return null;

  return (
    <section className="mt-16 md:mt-24 border-t border-border pt-12 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-6 gap-4">
        <div>
          {subtitle && (
            <p className="text-[10px] uppercase tracking-[0.3em] text-cognac font-bold mb-1">
              {subtitle}
            </p>
          )}
          <h2 className="font-serif text-2xl md:text-3xl font-bold">{title}</h2>
        </div>
        <button
          onClick={clearList}
          className="text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear History
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
        {items.map((product, i) => (
          <ProductCard key={product.id} product={product as any} index={i} />
        ))}
      </div>
    </section>
  );
}
