"use client";

import React from "react";
import { SlidersHorizontal, ArrowRight } from "lucide-react";
import { ProductCard } from "@/modules/products/components/ProductCard";

interface ProductGridProps {
  products: any[];
  totalProducts: number;
  loadingMore: boolean;
  onLoadMore: () => void;
  onClearAll: () => void;
}

export function ProductGrid({
  products,
  totalProducts,
  loadingMore,
  onLoadMore,
  onClearAll,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-20 px-6 text-center border border-dashed border-brass/30 rounded-3xl bg-cream/30 backdrop-blur-xs flex flex-col items-center justify-center max-w-xl mx-auto my-12 shadow-xs">
        <div className="h-16 w-16 bg-brass/10 rounded-full flex items-center justify-center mb-6 text-cognac">
          <SlidersHorizontal className="h-8 w-8" />
        </div>
        <h3 className="font-serif text-xl font-bold text-charcoal mb-2">
          No Matching Styles Found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          We couldn't find any footwear in our current catalog matching your filters. Try clearing
          some filters or searching for something else.
        </p>
        <button
          onClick={onClearAll}
          className="bg-charcoal text-cream hover:bg-cognac px-6 py-3 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>

      {products.length < totalProducts && (
        <div className="mt-16 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground font-semibold">
            Showing {products.length} of {totalProducts} footwear styles
          </p>
          <div className="w-48 h-1 bg-border/40 rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full bg-cognac rounded-full transition-all duration-500"
              style={{ width: `${(products.length / totalProducts) * 100}%` }}
            />
          </div>
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-8 py-3.5 bg-charcoal text-cream hover:bg-cognac text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-cream/35 border-t-cream rounded-full animate-spin" />
                Loading Styles…
              </>
            ) : (
              <>
                Load More Styles
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
