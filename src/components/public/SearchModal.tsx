"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";

interface SearchModalProps {
  onClose: () => void;
  categoriesList: any[];
}

export function SearchModal({ onClose, categoriesList }: SearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery, searchResults]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rbh-recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const delay = setTimeout(() => {
      fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSearchResults(data);
          }
        })
        .catch((err) => console.error("Search failed:", err))
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleSearchSubmit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem("rbh-recent-searches", JSON.stringify(updated));
    } catch {}

    onClose();
    setSearchQuery("");
    router.push(`/shop?search=${encodeURIComponent(trimmed)}`);
  };

  const matchedBrands = useMemo(() => {
    return Array.from(new Set(searchResults.map((p) => p.brand).filter(Boolean))).slice(0, 3);
  }, [searchResults]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalNavigable = matchedBrands.length + Math.min(searchResults.length, 6);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < totalNavigable - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (focusedIndex >= 0 && focusedIndex < totalNavigable) {
        e.preventDefault();
        if (focusedIndex < matchedBrands.length) {
          const brand = matchedBrands[focusedIndex];
          onClose();
          setSearchQuery("");
          router.push(`/shop?brand=${encodeURIComponent(brand)}`);
        } else {
          const prodIdx = focusedIndex - matchedBrands.length;
          const product = searchResults.slice(0, 6)[prodIdx];
          onClose();
          setSearchQuery("");
          router.push(`/shop/${product.slug}`);
        }
      } else {
        handleSearchSubmit(searchQuery);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 100);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-charcoal/55 backdrop-blur-sm"
      />

      <div className="flex min-h-full items-start justify-center p-4 pt-16 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-card border border-border/80 shadow-2xl flex flex-col gap-0 relative"
        >
          {/* Search Input Bar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for footwear, brands, or categories..."
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 hover:bg-muted rounded-lg transition"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-muted px-2 py-1 rounded">
                ESC
              </span>
            </button>
          </div>

          {/* Results Body */}
          <div className="overflow-y-auto max-h-[420px] p-4 space-y-5">
            {searching && (
              <div className="py-10 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary mx-auto mb-3"></div>
                <p className="text-sm text-muted-foreground font-medium">Searching catalog...</p>
              </div>
            )}

            {!searching && !searchQuery.trim() && (
              <>
                {recentSearches.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mb-2.5">
                      Recent Searches
                    </h4>
                    <div className="space-y-1">
                      {recentSearches.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSearchSubmit(s)}
                          className="flex items-center gap-2.5 text-sm text-foreground/70 hover:text-primary py-1.5 w-full text-left hover:bg-muted px-2 rounded-lg transition-all"
                        >
                          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{s}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mb-2.5">
                    Browse Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {categoriesList.map((c) => (
                      <button
                        key={c.id || c._id}
                        onClick={() => {
                          onClose();
                          router.push(`/shop?category=${c.slug}`);
                        }}
                        className="px-3.5 py-1.5 bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 rounded-full text-xs font-semibold text-foreground/70 transition-all"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!searching && searchQuery.trim() && searchResults.length === 0 && (
              <div className="py-12 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">
                  No matches for "{searchQuery}"
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Try a brand name like "Lakhani" or category like "bridal"
                </p>
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <>
                {matchedBrands.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mb-2.5">
                      Brands
                    </h4>
                    <div className="flex gap-2">
                      {matchedBrands.map((b, idx) => {
                        const isFocused = focusedIndex === idx;
                        return (
                          <button
                            key={b}
                            onClick={() => {
                              onClose();
                              router.push(`/shop?brand=${encodeURIComponent(b)}`);
                            }}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                              isFocused
                                ? "bg-brass/20 border-brass/40 text-cognac ring-2 ring-primary/20"
                                : "bg-brass/10 border-brass/20 text-cognac hover:bg-brass/20"
                            }`}
                          >
                            {b}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mb-2.5">
                    Products ({searchResults.length})
                  </h4>
                  <div className="space-y-1">
                    {searchResults.slice(0, 6).map((p, idx) => {
                      const isFocused = focusedIndex === matchedBrands.length + idx;
                      return (
                        <Link
                          key={p.id}
                          href={`/shop/${p.slug}`}
                          onClick={onClose}
                          className={`flex items-center gap-3.5 group p-2 rounded-xl transition-all ${
                            isFocused ? "bg-muted ring-1 ring-border/60" : "hover:bg-muted/60"
                          }`}
                        >
                          <Image
                            src={p.image}
                            alt=""
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-lg object-cover border border-border/60 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                              {p.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {p.brand} · {formatINR(p.price)}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0" />
                        </Link>
                      );
                    })}
                  </div>
                  {searchResults.length > 6 && (
                    <button
                      onClick={() => handleSearchSubmit(searchQuery)}
                      className="mt-3 w-full py-2 text-xs font-bold text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 rounded-xl transition-all"
                    >
                      View all {searchResults.length} results for "{searchQuery}"
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
