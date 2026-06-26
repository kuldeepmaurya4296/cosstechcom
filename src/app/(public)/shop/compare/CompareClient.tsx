"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import { Search, X, ShoppingBag, Plus, Star, Check, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface CompareClientProps {
  initialProducts: any[];
}

export function CompareClient({ initialProducts }: CompareClientProps) {
  const { add } = useCart();
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Synchronize URL with compared product slugs
  useEffect(() => {
    const slugs = products.map((p) => p.slug).join(",");
    const newUrl = slugs ? `/shop/compare?slugs=${slugs}` : "/shop/compare";
    window.history.replaceState({}, "", newUrl);
  }, [products]);

  // Search autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out products already in comparison
          const filtered = data.filter((item: any) => !products.some((p) => p.id === item.id));
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery, products]);

  const addProduct = (p: any) => {
    if (products.length >= 4) {
      toast.error("You can compare up to 4 products at a time.");
      return;
    }
    setProducts((prev) => [...prev, p]);
    setSearchQuery("");
    setShowSearch(false);
    toast.success(`${p.name} added to comparison`);
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddToCart = (p: any) => {
    const defaultVariant = p.variants && p.variants[0] ? p.variants[0] : { size: "Free Size", color: "Default" };
    const size = defaultVariant.size || "Free Size";
    const color = defaultVariant.color || "Default";
    add(p, { size, color, quantity: 1 });
    toast.success(`Added ${p.name} to cart!`);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Comparison link copied to clipboard!");
  };

  // Compile all unique specification keys across all products in comparison
  const allSpecKeys = Array.from(
    new Set(
      products.flatMap((p) => p.specifications || []).map((s) => s.key)
    )
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-charcoal">
            Product Comparison
          </h1>
          <p className="text-xs text-muted-foreground mt-2 max-w-lg leading-relaxed">
            Compare premium features, dimensions, compliance, and pricing side-by-side to make the perfect choice.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {products.length > 0 && (
            <button
              onClick={copyShareLink}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card rounded-xl text-xs font-semibold text-charcoal hover:bg-neutral-50 transition cursor-pointer"
            >
              <Share2 className="h-4 w-4" /> Share Link
            </button>
          )}

          {products.length < 4 && (
            <div className="relative flex-1 md:flex-initial">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-charcoal text-cream rounded-xl text-xs font-semibold hover:bg-cognac transition cursor-pointer w-full justify-center md:w-auto"
              >
                <Plus className="h-4 w-4" /> Add Product
              </button>

              {showSearch && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 bg-muted/50 border border-border/40 rounded-xl px-3 py-1.5 mb-3">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Search product..."
                      className="bg-transparent border-none outline-none text-xs w-full font-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searching ? (
                      <div className="flex justify-center items-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground">
                        {searchQuery ? "No products found." : "Type to search..."}
                      </div>
                    ) : (
                      searchResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => addProduct(p)}
                          className="flex items-center gap-3 hover:bg-neutral-50 p-2 rounded-xl transition cursor-pointer border border-transparent hover:border-neutral-100"
                        >
                          <img
                            src={p.image || "/assets/product-placeholder.jpg"}
                            className="h-10 w-10 object-cover rounded-lg border shrink-0"
                            alt=""
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate text-charcoal">
                              {p.name}
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              {p.brand} · {formatINR(p.price)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border/80 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Search className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-lg font-bold text-charcoal">No Products Selected</h2>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
            Choose up to 4 premium marketplace products to compare specs, ratings, and features.
          </p>
          <button
            onClick={() => setShowSearch(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-charcoal text-cream rounded-xl text-xs font-semibold hover:bg-cognac transition cursor-pointer"
          >
            <Search className="h-4 w-4" /> Start Searching
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border/80 rounded-2xl bg-card shadow-sm">
          <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
            <thead>
              <tr className="border-b border-border/50">
                <th className="p-6 text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/5 bg-neutral-50/50">
                  Product Details
                </th>
                {products.map((p) => (
                  <th key={p.id} className="p-6 w-1/5 relative align-top">
                    {/* Remove Action */}
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="absolute top-4 right-4 p-1 bg-neutral-100 hover:bg-red-500 hover:text-white text-muted-foreground rounded-full transition cursor-pointer"
                      title="Remove product"
                    >
                      <X className="h-3 w-3" />
                    </button>

                    <div className="space-y-4 pr-4">
                      <Link href={`/shop/${p.slug}`}>
                        <img
                          src={p.image || "/assets/product-placeholder.jpg"}
                          className="h-40 w-full object-cover rounded-xl border border-border/40 hover:scale-[1.02] transition duration-300"
                          alt={p.name}
                        />
                      </Link>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-cognac font-bold">
                          {p.brand}
                        </span>
                        <Link href={`/shop/${p.slug}`} className="block">
                          <h3 className="font-serif text-xs font-bold text-charcoal hover:text-primary transition mt-0.5 line-clamp-2 leading-relaxed">
                            {p.name}
                          </h3>
                        </Link>
                      </div>

                      {/* Add to Cart button */}
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-charcoal text-cream hover:bg-cognac rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" /> Buy Now
                      </button>
                    </div>
                  </th>
                ))}
                {/* Empty columns if fewer than 4 compared products */}
                {Array.from({ length: 4 - products.length }).map((_, idx) => (
                  <th key={`empty-${idx}`} className="p-6 w-1/5 align-middle border-l border-border/30">
                    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-neutral-200 rounded-xl">
                      <button
                        onClick={() => setShowSearch(true)}
                        className="p-3 bg-neutral-100 text-muted-foreground rounded-full hover:bg-primary/10 hover:text-primary transition cursor-pointer"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                      <span className="text-[10px] text-neutral-400 mt-2 font-medium">Add Product</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Price details */}
              <tr className="border-b border-border/30 hover:bg-neutral-50/20">
                <td className="p-5 text-xs font-bold text-charcoal bg-neutral-50/50">Price</td>
                {products.map((p) => (
                  <td key={p.id} className="p-5">
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-cognac font-serif">
                        {formatINR(p.price)}
                      </span>
                      {p.compareAt && p.compareAt > p.price && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground line-through">
                            {formatINR(p.compareAt)}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                            Save {Math.round(((p.compareAt - p.price) / p.compareAt) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                ))}
                {Array.from({ length: 4 - products.length }).map((_, idx) => (
                  <td key={`empty-p-${idx}`} className="p-5 border-l border-border/30" />
                ))}
              </tr>

              {/* Row 2: Customer Rating */}
              <tr className="border-b border-border/30 hover:bg-neutral-50/20">
                <td className="p-5 text-xs font-bold text-charcoal bg-neutral-50/50">Rating</td>
                {products.map((p) => (
                  <td key={p.id} className="p-5">
                    <div className="flex items-center gap-1">
                      <div className="flex items-center text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </div>
                      <span className="text-xs font-bold text-charcoal">{p.rating}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ({p.reviewsCount} reviews)
                      </span>
                    </div>
                  </td>
                ))}
                {Array.from({ length: 4 - products.length }).map((_, idx) => (
                  <td key={`empty-r-${idx}`} className="p-5 border-l border-border/30" />
                ))}
              </tr>

              {/* Row 3: Shipping */}
              <tr className="border-b border-border/30 hover:bg-neutral-50/20">
                <td className="p-5 text-xs font-bold text-charcoal bg-neutral-50/50">Shipping</td>
                {products.map((p) => (
                  <td key={p.id} className="p-5 text-xs">
                    {p.freeShipping ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <Check className="h-3 w-3" /> Free Shipping
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Standard delivery charges apply</span>
                    )}
                  </td>
                ))}
                {Array.from({ length: 4 - products.length }).map((_, idx) => (
                  <td key={`empty-s-${idx}`} className="p-5 border-l border-border/30" />
                ))}
              </tr>

              {/* Section Header: Technical Specifications */}
              {allSpecKeys.length > 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4 bg-muted/40 font-serif text-xs font-bold text-charcoal tracking-wide uppercase"
                  >
                    Product Specifications
                  </td>
                </tr>
              )}

              {/* Specification rows */}
              {allSpecKeys.map((key) => (
                <tr key={key} className="border-b border-border/30 hover:bg-neutral-50/20">
                  <td className="p-5 text-xs font-bold text-charcoal bg-neutral-50/50 capitalize">
                    {key}
                  </td>
                  {products.map((p) => {
                    const spec = (p.specifications || []).find((s: any) => s.key === key);
                    return (
                      <td key={p.id} className="p-5 text-xs text-muted-foreground leading-relaxed">
                        {spec ? spec.value : "—"}
                      </td>
                    );
                  })}
                  {Array.from({ length: 4 - products.length }).map((_, idx) => (
                    <td key={`empty-spec-${idx}`} className="p-5 border-l border-border/30" />
                  ))}
                </tr>
              ))}

              {/* Section Header: Legal & Compliance */}
              <tr>
                <td
                  colSpan={5}
                  className="p-4 bg-muted/40 font-serif text-xs font-bold text-charcoal tracking-wide uppercase"
                >
                  Legal Compliance & Origin
                </td>
              </tr>

              {/* HSN Code */}
              <tr className="border-b border-border/30 hover:bg-neutral-50/20">
                <td className="p-5 text-xs font-bold text-charcoal bg-neutral-50/50">HSN Code</td>
                {products.map((p) => (
                  <td key={p.id} className="p-5 text-xs font-mono text-charcoal font-medium">
                    {p.hsnCode || "—"}
                  </td>
                ))}
                {Array.from({ length: 4 - products.length }).map((_, idx) => (
                  <td key={`empty-hsn-${idx}`} className="p-5 border-l border-border/30" />
                ))}
              </tr>

              {/* Country of Origin */}
              <tr className="border-b border-border/30 hover:bg-neutral-50/20">
                <td className="p-5 text-xs font-bold text-charcoal bg-neutral-50/50">Origin</td>
                {products.map((p) => (
                  <td key={p.id} className="p-5 text-xs text-muted-foreground">
                    {p.countryOfOrigin || "India"}
                  </td>
                ))}
                {Array.from({ length: 4 - products.length }).map((_, idx) => (
                  <td key={`empty-origin-${idx}`} className="p-5 border-l border-border/30" />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
