"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";

const MotionImage = motion(Image);

const BRANDS = [
  "Lakhani",
  "Touch Footwear",
  "Paragon",
  "Goldstar Shoes",
  "Raja Exclusive",
  "Touch Heels",
  "Lakhani Canvas",
  "Paragon Comfort",
];

export function BrandMarquee() {
  const [brands, setBrands] = useState<string[]>(BRANDS);

  useEffect(() => {
    fetch("/api/brands")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBrands(data);
        }
      })
      .catch((err) => console.error("Failed to load marquee brands:", err));
  }, []);

  const repeatedBrands = [...brands, ...brands, ...brands, ...brands];

  return (
    <section className="bg-charcoal text-cream overflow-hidden py-8 lg:py-10 relative">
      <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-charcoal to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-charcoal to-transparent z-10 pointer-events-none" />

      <div className="text-center mb-6">
        <p className="text-[10px] uppercase tracking-[0.35em] text-brass/80 font-bold">
          Authorized Distribution
        </p>
      </div>

      <div className="flex w-full overflow-hidden">
        <motion.div
          className="flex gap-20 whitespace-nowrap text-xl md:text-2xl font-serif font-semibold italic text-cream/70 shrink-0"
          animate={{ x: [0, -1600] }}
          transition={{
            repeat: Infinity,
            duration: 35,
            ease: "linear",
          }}
        >
          {repeatedBrands.map((b, i) => (
            <span
              key={i}
              className="flex items-center gap-2 select-none hover:text-brass transition"
            >
              <Sparkles className="h-4 w-4 text-brass shrink-0" />
              {b}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

interface OccasionGridProps {
  occasions: any[];
}

export function OccasionGrid({ occasions }: OccasionGridProps) {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24 bg-cream/40 border-y border-border/80">
      <div className="max-w-2xl mb-10">
        <p className="text-[11px] uppercase tracking-[0.3em] text-cognac font-bold mb-2">
          Collections
        </p>
        <h2 className="font-serif text-3xl md:text-5xl font-bold text-charcoal">
          Curated By Occasion
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Footwear designed specifically for special Indian wedding events, corporate environments,
          daily errands, and school/sports activities.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {occasions.map((occ, i) => (
          <motion.div
            key={occ.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-card transition flex flex-col justify-between"
          >
            <div className="relative aspect-video w-full overflow-hidden">
              <Image
                src={occ.image}
                alt={occ.name}
                width={400}
                height={225}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="h-full w-full object-cover hover:scale-105 transition duration-500"
              />
              <span className="absolute top-3 right-3 bg-cream/90 text-cognac border border-brass/25 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">
                {occ.badge}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-charcoal">{occ.name}</h3>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{occ.desc}</p>
              </div>
              <Link
                href={`/shop?occasion=${occ.occasionKey}`}
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline font-semibold"
              >
                View styles <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

interface EditorialBannerProps {
  newest: any[];
}

export function EditorialBanner({ newest }: EditorialBannerProps) {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-2xl bg-gradient-to-br from-charcoal to-charcoal/90 text-cream p-8 md:p-16 grid md:grid-cols-2 gap-10 items-center overflow-hidden relative border border-border/10 shadow-elevated"
      >
        <div className="absolute inset-0 grain opacity-20" />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.3em] text-brass font-bold mb-3">
            Gupta Brothers Enterprise
          </p>
          <h3 className="font-serif text-3xl md:text-5xl font-bold leading-tight">
            Quality footwear
            <br />
            <em className="text-brass not-italic">for all demographics.</em>
          </h3>
          <p className="mt-5 text-cream/70 text-sm leading-relaxed max-w-md">
            Raja Boot House has been a retail staple since 2025 under the stewardship of Prince and
            Bipin Gupta. We offer hand-finished design profiles, bridal/groom wedding accessories,
            and durability guaranteed by India's biggest national brands.
          </p>
          <Link
            href="/shop"
            className="mt-7 inline-flex items-center gap-2 bg-cream text-charcoal px-6 py-3.5 rounded-full text-xs font-bold hover:bg-cream/90 transition"
          >
            Explore Catalog <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="relative grid grid-cols-2 gap-3">
          {newest.map((p, i) => (
            <MotionImage
              key={p.id}
              src={p.image}
              alt={p.name}
              width={200}
              height={200}
              sizes="(max-width: 640px) 50vw, 25vw"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-lg object-cover aspect-square border border-border/10 ${i % 2 ? "translate-y-6" : ""}`}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
