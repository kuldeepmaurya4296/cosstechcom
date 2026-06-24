"use client";

import React from "react";
import { X, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface ActiveFiltersProps {
  categories: any[];
  activeCategory: string;
  activeBrands: string[];
  activeOccasion: string;
  activeSearch: string;
  activeMinPrice: string;
  activeMaxPrice: string;
  activeSizes: string[];
  activeGenders: string[];
  activeColors: string[];
  activeVendors: string[];
  activeDiscount: string;
  activeAvailability: string;
  vendors: { id: string; name: string }[];
  onRemoveFilter: (key: string, value?: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  categories,
  activeCategory,
  activeBrands,
  activeOccasion,
  activeSearch,
  activeMinPrice,
  activeMaxPrice,
  activeSizes,
  activeGenders,
  activeColors,
  activeVendors,
  activeDiscount,
  activeAvailability,
  vendors,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersProps) {
  const hasActiveFilters =
    activeCategory !== "all" ||
    activeBrands.length > 0 ||
    activeOccasion ||
    activeSearch ||
    activeMinPrice ||
    activeMaxPrice ||
    activeSizes.length > 0 ||
    activeGenders.length > 0 ||
    activeColors.length > 0 ||
    activeVendors.length > 0 ||
    activeDiscount ||
    activeAvailability === "in_stock";

  if (!hasActiveFilters) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 mb-8 bg-brass/5 p-4 rounded-2xl border border-brass/15"
    >
      <span className="text-xs text-cognac font-bold mr-2 uppercase tracking-wider">
        Active Filters:
      </span>

      {activeCategory !== "all" && (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-brass/25 text-cognac rounded-xl text-xs font-semibold shadow-xs">
          <span>
            Category:{" "}
            {categories.find((c) => c.slug === activeCategory)?.name || activeCategory}
          </span>
          <button
            onClick={() => onRemoveFilter("category")}
            className="hover:text-destructive cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {activeBrands.map((b) => (
        <span
          key={b}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-brass/25 text-cognac rounded-xl text-xs font-semibold shadow-xs"
        >
          <span>Brand: {b}</span>
          <button
            onClick={() => onRemoveFilter("brand", b)}
            className="hover:text-destructive cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      {activeOccasion && (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-brass/25 text-cognac rounded-xl text-xs font-semibold shadow-xs">
          <span>Occasion: {activeOccasion}</span>
          <button
            onClick={() => onRemoveFilter("occasion")}
            className="hover:text-destructive cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {activeSearch && (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-brass/25 text-cognac rounded-xl text-xs font-semibold shadow-xs">
          <span>Query: "{activeSearch}"</span>
          <button
            onClick={() => onRemoveFilter("search")}
            className="hover:text-destructive cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {activeMinPrice && (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-brass/25 text-cognac rounded-xl text-xs font-semibold shadow-xs">
          <span>Min: ₹{activeMinPrice}</span>
          <button
            onClick={() => onRemoveFilter("minPrice")}
            className="hover:text-destructive cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {activeMaxPrice && (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-brass/25 text-cognac rounded-xl text-xs font-semibold shadow-xs">
          <span>Max: ₹{activeMaxPrice}</span>
          <button
            onClick={() => onRemoveFilter("maxPrice")}
            className="hover:text-destructive cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {activeSizes.map((sStr) => (
        <span
          key={sStr}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-brass/25 text-cognac rounded-xl text-xs font-semibold shadow-xs"
        >
          <span>Size: UK {sStr}</span>
          <button
            onClick={() => onRemoveFilter("size", sStr)}
            className="hover:text-destructive cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      {activeGenders.map((g) => (
        <span
          key={g}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-brass/25 text-cognac rounded-xl text-xs font-semibold shadow-xs"
        >
          <span>Gender: {g}</span>
          <button
            onClick={() => onRemoveFilter("gender", g)}
            className="hover:text-destructive cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      {activeColors.map((c) => (
        <span
          key={c}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-brass/25 text-cognac rounded-xl text-xs font-semibold shadow-xs"
        >
          <span>Color: {c}</span>
          <button
            onClick={() => onRemoveFilter("color", c)}
            className="hover:text-destructive cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      {activeVendors.map((vId) => {
        const vendorName = vendors.find((v) => v.id === vId)?.name || "Unknown Seller";
        return (
          <span
            key={vId}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-brass/25 text-cognac rounded-xl text-xs font-semibold shadow-xs"
          >
            <span>Seller: {vendorName}</span>
            <button
              onClick={() => onRemoveFilter("vendor", vId)}
              className="hover:text-destructive cursor-pointer transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        );
      })}

      {activeDiscount && (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-brass/25 text-cognac rounded-xl text-xs font-semibold shadow-xs">
          <span>Min Discount: {activeDiscount}% Off</span>
          <button
            onClick={() => onRemoveFilter("discount")}
            className="hover:text-destructive cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {activeAvailability === "in_stock" && (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream border border-brass/25 text-cognac rounded-xl text-xs font-semibold shadow-xs">
          <span>Availability: In Stock</span>
          <button
            onClick={() => onRemoveFilter("availability")}
            className="hover:text-destructive cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      <button
        onClick={onClearAll}
        className="text-xs font-bold text-muted-foreground hover:text-destructive flex items-center gap-1.5 cursor-pointer py-1.5 px-3 hover:bg-muted/80 rounded-xl transition-colors ml-auto"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
      </button>
    </motion.div>
  );
}
