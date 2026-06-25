"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useState, useEffect } from "react";
import { Heart, ShoppingBag, Trash2, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import type { Product } from "@/data/products";

export default function AccountWishlistPage() {
  const { wishlist, toggleWish, add } = useCart();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (wishlist.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      wishlist.map((id) =>
        fetch(`/api/products/${id}`)
          .then((res) => res.json())
          .catch(() => null),
      ),
    )
      .then((results) => {
        const validProducts = results.filter((p): p is Product => p !== null && !p.error);
        setItems(validProducts);

        // Initialize default sizes for each product
        const defaults: Record<string, string | number> = {};
        validProducts.forEach((p) => {
          if (p.sizes && p.sizes.length > 0) {
            defaults[p.id] = p.sizes[0];
          }
        });
        setSelectedSizes((prev) => ({ ...defaults, ...prev }));
      })
      .finally(() => setLoading(false));
  }, [wishlist]);

  const handleSizeChange = (productId: string, size: string | number) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [productId]: size,
    }));
  };

  const handleMoveToBag = (product: Product) => {
    const size = selectedSizes[product.id] || product.sizes?.[0] || "";
    const color = product.colors?.[0] || "Default";

    // Add to cart
    add(product, { size, color, quantity: 1 });

    // Remove from wishlist
    toggleWish(product.id);

    const displaySize = () => {
      const sStr = String(size || "").trim();
      if (!sStr) return "";
      const num = Number(sStr);
      const isShoe = !isNaN(num) && num > 0 && num < 20;
      return isShoe ? `UK/IND ${sStr}` : sStr;
    };
    const sizeDesc = displaySize() ? `Size: ${displaySize()} · ` : "";

    // Toast notification
    toast.success(`Moved ${product.name} to Cart!`, {
      description: `${sizeDesc}Color: ${color}`,
    });
  };

  const handleRemove = (productId: string, productName: string) => {
    toggleWish(productId);
    toast.info(`Removed ${productName} from Wishlist`);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-muted rounded-lg"></div>
          <div className="h-4 w-24 bg-muted rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-3 border border-border/60 rounded-2xl p-4">
              <div className="aspect-square bg-muted rounded-xl"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-9 bg-muted rounded-lg mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Wishlist</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your curated list of style favorites
          </p>
        </div>
        {items.length > 0 && (
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full w-fit">
            Items Saved: <strong className="text-foreground">{items.length}</strong>
          </span>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-16 bg-card border border-border rounded-2xl shadow-sm"
          >
            <div className="h-14 w-14 bg-muted/60 text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <p className="font-serif text-lg font-bold text-foreground">Your Wishlist is Empty</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Save your favorite items, electronics, and fashion apparel here to keep track of their
              stock and prices.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 bg-primary hover:bg-cognac text-primary-foreground rounded-full px-6 py-2.5 text-xs font-bold shadow-md transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Explore Collection</span>
            </Link>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((p) => {
              const stock = p.stock ?? 10;
              const selectedSize = selectedSizes[p.id] || p.sizes?.[0] || "";

              // Stock badge style
              let stockLabel = "In Stock";
              let stockClass = "bg-green-500/10 text-green-700 border-green-500/20";
              if (stock <= 0) {
                stockLabel = "Out of Stock";
                stockClass = "bg-red-500/10 text-red-700 border-red-500/20";
              } else if (stock <= 5) {
                stockLabel = `Only ${stock} left!`;
                stockClass = "bg-orange-500/10 text-orange-700 border-orange-500/20 animate-pulse";
              }

              return (
                <motion.div
                  layout
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="group relative bg-card border border-border hover:border-brass/25 hover:shadow-md rounded-2xl overflow-hidden p-4 flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Image Container */}
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-muted border border-border/40">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Top Action Row */}
                      <div className="absolute top-2.5 inset-x-2.5 flex justify-between items-center">
                        <span
                          className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full border ${stockClass}`}
                        >
                          {stockLabel}
                        </span>

                        <button
                          onClick={() => handleRemove(p.id, p.name)}
                          className="h-8.5 w-8.5 rounded-full bg-cream/90 hover:bg-red-50 text-charcoal hover:text-red-600 backdrop-blur shadow-sm grid place-items-center transition cursor-pointer border-0"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Product Metadata */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-brass">
                          {p.category}
                        </span>
                        {p.badge && (
                          <span className="text-[8px] font-extrabold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {p.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-sm font-bold text-foreground leading-snug line-clamp-1">
                        {p.name}
                      </h3>

                      {/* Prices */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-extrabold text-foreground">
                          {formatINR(p.price)}
                        </span>
                        {p.compareAt && (
                          <span className="text-xs text-muted-foreground line-through font-medium">
                            {formatINR(p.compareAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sizing Picker (Premium addition) */}
                    {p.sizes && p.sizes.length > 0 && stock > 0 && (
                      <div className="mt-4 pt-3.5 border-t border-border/40 space-y-2">
                        <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
                          {(() => {
                            const categorySlug = String(p.category || "").toLowerCase();
                            const tagsList = ((p as any).tags || p.details || []).map((t: string) => String(t).toLowerCase());
                            const isFootwear = categorySlug.includes("footwear") || categorySlug.includes("shoes") || tagsList.includes("shoes") || tagsList.includes("footwear");
                            const isFashion = categorySlug.includes("fashion") || categorySlug.includes("apparel") || categorySlug.includes("clothing") || tagsList.includes("clothing") || tagsList.includes("fashion");
                            const isGrocery = categorySlug.includes("grocery") || categorySlug.includes("staples") || categorySlug.includes("beverage") || tagsList.includes("grocery") || tagsList.includes("rice") || tagsList.includes("tea");
                            const isElectronics = categorySlug.includes("electronics") || categorySlug.includes("phone") || categorySlug.includes("mobiles") || categorySlug.includes("laptops") || tagsList.includes("electronics");
                            
                            if (isFootwear) return "Select UK Size:";
                            if (isFashion) return "Select Size:";
                            if (isGrocery) return "Select Pack Size:";
                            if (isElectronics) return "Select Config:";
                            return "Select Option:";
                          })()}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => handleSizeChange(p.id, size)}
                              className={`h-7 px-2.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                                String(selectedSize) === String(size)
                                  ? "bg-primary border-primary text-primary-foreground font-extrabold shadow-sm"
                                  : "bg-background border-border text-muted-foreground hover:border-muted-foreground/45 hover:text-foreground"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Actions */}
                  <div className="mt-4">
                    {stock > 0 ? (
                      <button
                        onClick={() => handleMoveToBag(p)}
                        className="w-full py-2.5 bg-primary hover:bg-cognac text-primary-foreground text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer border-0"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Move to Bag</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2.5 bg-muted text-muted-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border-0"
                      >
                        <span>Out of Stock</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
