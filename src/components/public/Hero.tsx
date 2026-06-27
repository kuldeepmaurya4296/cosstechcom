"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SlideTheme {
  accent: string;
  tagBg: string;
}

// Same accent families as before, just used differently — now they
// drive a single hanging price-tag and the index rail, not a pill + glow.
const SLIDE_THEMES: SlideTheme[] = [
  { accent: "text-cognac", tagBg: "bg-cognac" },
  { accent: "text-rose-400", tagBg: "bg-rose-500" },
  { accent: "text-blue-300", tagBg: "bg-blue-500" },
  { accent: "text-emerald-300", tagBg: "bg-emerald-500" },
];

export function Hero({ initialBanners }: { initialBanners?: any[] }) {
  const [banners, setBanners] = useState<any[]>(
    initialBanners && initialBanners.length > 0 ? initialBanners : [],
  );
  const [current, setCurrent] = useState(0);
  const dragLock = useRef(false);

  // Fetch banners fallback in case none were passed
  useEffect(() => {
    if (banners.length === 0) {
      fetch("/api/banners")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setBanners(data);
          } else {
            setBanners(getFallbackBanners());
          }
        })
        .catch(() => {
          setBanners(getFallbackBanners());
        });
    }
  }, [banners.length]);

  // Autoplay timer - resets when current changes
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length, current]);

  const getFallbackBanners = () => [
    {
      id: "b1",
      title: "Crafted for Character",
      subtitle:
        "Hand-finished leather boots stitched using family bootmaking tradition. Structured to age beautifully with you.",
      cta: "Shop the collection",
      href: "/shop",
      tagline: "Artisan Leather",
      badgeTitle: "Oxford Welted Boot",
      badgePrice: "From ₹2,499",
      image:
        "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=800&auto=format&fit=crop",
      objectPosition: "object-[20%_center]",
    },
    {
      id: "b2",
      title: "Royal Wedding Heritage",
      subtitle:
        "Hand-embroidered groom sherwani mojaris and custom bridal footwear tailored for ultimate comfort on your special night.",
      cta: "Explore Wedding collection",
      href: "/shop?category=bridal",
      tagline: "Traditional Sherwani Jootis",
      badgeTitle: "Golden Zardozi Mojari",
      badgePrice: "From ₹1,899",
      image:
        "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?q=80&w=800&auto=format&fit=crop",
      objectPosition: "object-center",
    },
    {
      id: "b3",
      title: "Modern Comfort in Motion",
      subtitle:
        "Lightweight, shock-absorbing athletic running shoes and everyday casual wear guaranteed by India's top national brands.",
      cta: "Shop Top Brands",
      href: "/shop?category=sports",
      tagline: "Official Retail Partner",
      badgeTitle: "Lakhani Classic Runner",
      badgePrice: "From ₹899",
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
      objectPosition: "object-center",
    },
    {
      id: "b4",
      title: "The Statement Heels Collection",
      subtitle:
        "Elevate your look with block heels, festive ethnic flats, and daily sandals built with ergonomic arch support.",
      cta: "Shop Women Collection",
      href: "/shop?category=women",
      tagline: "Exclusive Women's Collection",
      badgeTitle: "Cognac Block Strap Heel",
      badgePrice: "From ₹1,499",
      image:
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop",
      objectPosition: "object-center",
    },
  ];

  if (banners.length === 0) {
    return (
      <div className="h-[600px] w-full bg-charcoal flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cream"></div>
      </div>
    );
  }

  // Assign image fallbacks for dynamic banners that might not specify images
  const slides = banners.map((b, idx) => {
    let img = b.imageUrl || b.image;
    const fallbacks = getFallbackBanners();
    if (!img) {
      img = fallbacks[idx % fallbacks.length].image;
    }
    return {
      ...b,
      image: img,
      href: b.linkUrl || b.href || "/shop",
      cta: b.cta || "Shop Collection",
      tagline: b.tagline || "New Arrival",
      badgeTitle: b.badgeTitle || b.title || "Featured Style",
      badgePrice: b.badgePrice || "View Details",
      objectPosition: b.objectPosition || "object-center",
    };
  });

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  const active = slides[current];
  const theme = SLIDE_THEMES[current % SLIDE_THEMES.length];

  return (
    <section className="relative overflow-hidden bg-charcoal h-[480px] sm:h-[530px] md:h-[580px] lg:h-[620px] flex items-end">
      {/* Full-bleed photograph layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={active.image}
            alt="CosstechCom Showcase"
            fill
            priority={current === 0}
            className={`object-cover ${active.objectPosition}`}
          />
        </motion.div>
      </AnimatePresence>

      {/* Legibility scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/35 to-charcoal/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 via-transparent to-transparent pointer-events-none hidden md:block" />

      {/* Film-grain texture, keeps the photographic feel from looking too clean */}
      <div className="absolute inset-0 grain opacity-10 pointer-events-none" />

      {/* Swipe layer */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(e, info) => {
          const threshold = 50;
          if (info.offset.x < -threshold) nextSlide();
          else if (info.offset.x > threshold) prevSlide();
        }}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
      />

      {/* Hanging price tag — the one signature flourish */}
      <div className="absolute top-7 right-6 md:top-10 md:right-12 z-20">
        <div className="absolute -top-5 right-3 w-px h-5 bg-cream/60 rotate-[16deg] origin-bottom" />
        <div className="absolute -top-6 right-[10px] h-1.5 w-1.5 rounded-full bg-cream/80 border border-charcoal/40" />
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: -8, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 3 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="relative bg-cream/95 backdrop-blur-md rounded-md pl-2.5 pr-4 py-2 shadow-elevated border border-border/60 flex items-center gap-2"
          >
            <span className="h-2 w-2 rounded-full bg-charcoal/10 border border-charcoal/30 shrink-0" />
            <div className="leading-tight">
              <div className="text-[7.5px] uppercase tracking-widest text-muted-foreground font-bold truncate max-w-[110px]">
                {active.badgeTitle}
              </div>
              <div className={`text-xs font-extrabold ${theme.accent}`}>
                {active.badgePrice}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Vertical index rail — desktop only, real slide order so numbering earns its place */}
      {slides.length > 1 && (
        <div className="hidden lg:flex absolute right-10 top-1/2 -translate-y-1/2 z-20 flex-col items-end gap-5">
          {slides.map((slide, idx) => {
            const isActive = idx === current;
            return (
              <button
                key={slide.id || idx}
                onClick={() => setCurrent(idx)}
                className="group flex items-center gap-3"
                aria-label={`Go to slide ${idx + 1}`}
              >
                <span
                  className={`text-[11px] font-bold tracking-wider tabular-nums transition-colors duration-300 ${isActive ? "text-cream" : "text-cream/35 group-hover:text-cream/70"
                    }`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span
                  className={`h-px transition-all duration-300 ${isActive
                      ? `w-10 ${theme.tagBg}`
                      : "w-4 bg-cream/30 group-hover:w-6 group-hover:bg-cream/50"
                    }`}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Prev / next — quiet ghost controls, bottom-right above the rail */}
      {slides.length > 1 && (
        <div className="hidden md:flex absolute right-8 bottom-10 z-20 gap-2">
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="h-10 w-10 rounded-full border border-cream/25 text-cream/80 hover:text-charcoal hover:bg-cream grid place-items-center transition duration-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="h-10 w-10 rounded-full border border-cream/25 text-cream/80 hover:text-charcoal hover:bg-cream grid place-items-center transition duration-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Content panel — bottom-anchored, editorial */}
      <div className="relative z-20 w-full pb-8 md:pb-12 lg:pb-14">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl"
            >
              {/* Eyebrow: thin rule + label, no pill/icon */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="flex items-center gap-3 mb-3"
              >
                <span className="h-px w-9 bg-cream/50" />
                <span className={`text-[10px] md:text-xs tracking-[0.3em] uppercase font-bold ${theme.accent}`}>
                  {active.tagline}
                </span>
              </motion.div>

              {/* Curtain-reveal heading */}
              <div className="overflow-hidden">
                <motion.h1
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-100%" }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="font-serif text-[32px] leading-[1.08] sm:text-[40px] md:text-6xl md:leading-[0.98] font-bold text-cream"
                >
                  {active.title}
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.45 }}
                className="mt-4 text-sm md:text-base text-cream/75 max-w-md leading-relaxed"
              >
                {active.subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.45 }}
                className="flex flex-wrap items-center gap-5 pt-6"
              >
                <Link
                  href={active.href}
                  className="group relative inline-flex items-center gap-2 bg-cream text-charcoal px-7 py-3.5 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02]"
                >
                  {active.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </Link>

                <Link
                  href="/shop"
                  className="group inline-flex items-center gap-1.5 text-xs md:text-sm font-bold uppercase tracking-widest text-cream/80 hover:text-cream transition duration-300 relative py-1"
                >
                  View Gallery
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cream transition-all duration-300 group-hover:w-full" />
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile dot indicators */}
      {slides.length > 1 && (
        <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${current === i ? "w-6 bg-cream" : "w-1.5 bg-cream/30"
                }`}
            />
          ))}
        </div>
      )}

      {/* Autoplay progress hairline */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cream/10 z-20">
          <motion.div
            key={active.id}
            className={`h-full ${theme.tagBg}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 6, ease: "linear" }}
          />
        </div>
      )}
    </section>
  );
}