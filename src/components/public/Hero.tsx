"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

export function Hero({ initialBanners }: { initialBanners?: any[] }) {
  const [banners, setBanners] = useState<any[]>(
    initialBanners && initialBanners.length > 0 ? initialBanners : [],
  );
  const [current, setCurrent] = useState(0);

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

  // Autoplay timer
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

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
        "Elevate your look with  block heels, festive ethnic flats, and daily sandals built with ergonomic arch support.",
      cta: "Shop Women Collection",
      href: "/shop?category=women",
      tagline: "Atelier Women's Collection",
      badgeTitle: "Cognac Block Strap Heel",
      badgePrice: "From ₹1,499",
      image:
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop",
      objectPosition: "object-center",
    },
  ];

  if (banners.length === 0) {
    return (
      <div className="h-[500px] w-full bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cognac"></div>
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
      cta:
        b.cta ||
        (idx === 1
          ? "Explore Wedding collection"
          : idx === 2
            ? "Shop Top Brands"
            : idx === 3
              ? "Shop Women Collection"
              : "Shop the collection"),
      tagline: b.tagline || fallbacks[idx % fallbacks.length].tagline,
      badgeTitle: b.badgeTitle || fallbacks[idx % fallbacks.length].badgeTitle,
      badgePrice: b.badgePrice || fallbacks[idx % fallbacks.length].badgePrice,
      objectPosition: b.objectPosition || "object-center",
    };
  });

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const active = slides[current];

  return (
    <section className="relative bg-cream border-b border-border/40 py-10 md:py-16 lg:py-20 flex items-center min-h-[580px]">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          const swipeThreshold = 50;
          if (info.offset.x < -swipeThreshold) {
            nextSlide();
          } else if (info.offset.x > swipeThreshold) {
            prevSlide();
          }
        }}
        className="w-full relative z-10"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Slide Content Column (Top on mobile, left on desktop) */}
            <div className="relative flex flex-col justify-center text-center md:text-left items-center md:items-start">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4 md:space-y-6 flex flex-col items-center md:items-start"
                >
                  <span className="inline-block text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-cognac font-extrabold border border-brass/35 rounded-full px-3 py-1 bg-cream/80 backdrop-blur-xs shadow-2xs">
                    {active.tagline}
                  </span>

                  <h1 className="font-serif text-[32px] leading-[1.1] md:text-6xl md:leading-[0.98] font-bold text-charcoal text-balance">
                    {active.title}
                  </h1>

                  <p className="text-xs md:text-base text-muted-foreground max-w-md">
                    {active.subtitle}
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <Link
                      href={active.href}
                      className="inline-flex items-center gap-2 bg-charcoal text-cream hover:bg-cognac px-6 py-3.5 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-300 group cursor-pointer shadow-md hover:shadow-lg hover:scale-102"
                    >
                      {active.cta}{" "}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slide Image Column (Bottom on mobile with padding, right on desktop) */}
            <div className="relative w-full max-w-[340px] md:max-w-[352px] mx-auto px-4 md:px-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.6 }}
                  className="relative w-full"
                >
                  <div className="relative aspect-[4/3] md:aspect-[4/5] rounded-2xl overflow-hidden shadow-elevated border border-border/60 bg-white">
                    <Image
                      src={active.image}
                      alt="CosstechCom"
                      width={800}
                      height={1000}
                      priority={current === 0}
                      className={`h-full w-full object-cover ${active.objectPosition} transition duration-700`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Floating Spec Badge */}
                  <div className="absolute -bottom-4 left-6 md:-left-4 md:bottom-6 bg-cream/95 backdrop-blur-sm border border-brass/25 rounded-2xl shadow-card px-4 py-3 max-w-[220px]">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                      Featured Style
                    </div>
                    <div className="font-serif font-bold text-xs md:text-sm mt-1 text-charcoal truncate">
                      {active.badgeTitle}
                    </div>
                    <div className="text-[11px] text-cognac font-bold mt-1">
                      {active.badgePrice}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation arrows (desktop only) */}
      {slides.length > 1 && (
        <div className="hidden md:flex absolute bottom-8 right-8 gap-2 z-10">
          <button
            onClick={prevSlide}
            className="h-10 w-10 border border-border/80 bg-cream hover:bg-muted text-charcoal hover:text-cognac rounded-full grid place-items-center transition cursor-pointer"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="h-10 w-10 border border-border/80 bg-cream hover:bg-muted text-charcoal hover:text-cognac rounded-full grid place-items-center transition cursor-pointer"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Navigation Indicators dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                current === i
                  ? "w-6 bg-cognac"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
