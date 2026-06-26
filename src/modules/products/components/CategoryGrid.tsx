"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { categories as fallbackCategories } from "@/data/categories";
import Image from "next/image";

const fallbacks: Record<string, string> = {
  electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800&auto=format&fit=crop",
  fashion: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
  grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop",
  "home-furniture": "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop",
  "sports-fitness": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop",
};

export function CategoryGrid() {
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/categories?level=1&hasProducts=true")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategoriesList(data);
        } else {
          setCategoriesList(fallbackCategories);
        }
      })
      .catch(() => {
        setCategoriesList(fallbackCategories);
      });
  }, []);

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-cognac font-semibold mb-2">
            Browse
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-charcoal">Shop by Style</h2>
        </div>
        <Link
          href="/shop"
          className="hidden md:inline text-sm font-semibold underline underline-offset-4 cursor-pointer"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
        {categoriesList.map((c, i) => {
          const imgUrl = c.imageUrl || fallbacks[c.slug] || fallbacks[c.slug?.replace("s", "")];
          return (
            <motion.div
              key={c.id || c._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 5) * 0.03 }}
            >
              <Link href={`/shop?category=${c.slug}`} className="block group cursor-pointer">
                <div className="aspect-[4/5] md:aspect-[3/4] rounded-xl bg-gradient-to-br from-muted via-secondary to-cream relative overflow-hidden border border-border group-hover:shadow-lg transition-all duration-300">
                  {imgUrl ? (
                    <>
                      <Image
                        src={imgUrl}
                        alt={c.name}
                        width={300}
                        height={400}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-750 ease-out group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-muted via-secondary to-cream" />
                  )}
                  <div className="absolute inset-0 grain opacity-40" />
                  <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end z-10">
                    <h3
                      className={`font-serif text-base md:text-xl font-bold transition-colors duration-300 ${imgUrl ? "text-cream group-hover:text-brass" : "text-charcoal group-hover:text-primary"}`}
                    >
                      {c.name}
                    </h3>
                    <p
                      className={`text-[10px] uppercase tracking-wider mt-1 transition-colors duration-300 ${imgUrl ? "text-cream/80" : "text-muted-foreground"}`}
                    >
                      {c.productCount || 0} styles
                    </p>
                  </div>
                  <div
                    className={`absolute top-4 right-4 h-8 w-8 rounded-full grid place-items-center text-xs transition z-10 ${
                      imgUrl
                        ? "bg-cream text-charcoal group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110"
                        : "bg-charcoal text-cream group-hover:bg-primary group-hover:scale-110"
                    } duration-300`}
                  >
                    →
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile Shop All Button - Larger, Tappable & Premium */}
      <div className="mt-8 flex justify-center md:hidden">
        <Link
          href="/shop"
          className="w-full bg-primary text-primary-foreground text-center py-4 rounded-xl text-xs sm:text-sm font-semibold uppercase tracking-wider hover:opacity-95 active:scale-98 transition shadow-md flex items-center justify-center gap-2 cursor-pointer border border-primary/20"
        >
          Shop All Styles →
        </Link>
      </div>
    </section>
  );
}
