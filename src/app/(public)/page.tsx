import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ensureDbReady, normalizeProduct } from "@/lib/db-utils";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Category";
import Brand from "@/lib/models/Brand";
import Settings from "@/lib/models/Settings";
import Banner from "@/lib/models/Banner";
import FlashSale from "@/lib/models/FlashSale";
import { OCCASIONS } from "@/data/occasions";
import { Hero } from "@/components/public/Hero";
import { CategoryGrid } from "@/modules/products/components/CategoryGrid";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { CountdownSale } from "@/components/public/CountdownSale";
import { RecentlyViewed } from "@/components/public/RecentlyViewed";
import {
  BrandMarquee,
  OccasionGrid,
  EditorialBanner,
} from "@/modules/products/components/HomeAnimations";
import { NewsletterFormClient } from "@/modules/products/components/NewsletterFormClient";
import { Award, ShieldCheck, Truck, RotateCcw, ArrowRight, HelpCircle } from "lucide-react";

const ICON_MAP: Record<string, any> = {
  Award,
  ShieldCheck,
  Truck,
  RotateCcw,
  HelpCircle,
};

const DEFAULT_TRUST_BADGES = [
  { icon: "Award", title: "Official Retailer", subtitle: "Lakhani, Touch, Paragon, Goldstar" },
  { icon: "ShieldCheck", title: "Gupta Brothers Craft", subtitle: "Premium quality assurance" },
  { icon: "Truck", title: "Free Shipping", subtitle: "Orders above ₹2000" },
  { icon: "RotateCcw", title: "Simple Exchanges", subtitle: "Within 30 days hassle-free" },
];

export const metadata: Metadata = {
  title: "CosstechCom — Ultimate Multi-Vendor Footwear Marketplace",
  description:
    "Shop premium footwear from multiple vendors, designers, and brands in India's leading footwear marketplace. Explore men's, women's, sports, and bridal collections.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CosstechCom — Multi-Vendor Footwear Marketplace",
    description: "Explore premium multi-vendor footwear collections.",
    images: [{ url: "/assets/hero-boots.jpg" }],
  },
};

async function getFeaturedProducts() {
  try {
    const { isReady } = await ensureDbReady();
    if (!isReady) return [];
    const rawProducts = await Product.find({ isActive: true, isFeatured: true })
      .populate({ path: "category", model: Category })
      .populate({ path: "brand", model: Brand })
      .sort({ createdAt: -1 })
      .limit(4);
    return rawProducts.map((p: any) => normalizeProduct(p));
  } catch (err) {
    console.error("Failed to load featured products:", err);
    return [];
  }
}

async function getNewArrivalProducts() {
  try {
    const { isReady } = await ensureDbReady();
    if (!isReady) return [];
    const rawProducts = await Product.find({ isActive: true, isNewArrival: true })
      .populate({ path: "category", model: Category })
      .populate({ path: "brand", model: Brand })
      .sort({ createdAt: -1 })
      .limit(4);
    return rawProducts.map((p: any) => normalizeProduct(p));
  } catch (err) {
    console.error("Failed to load new arrivals:", err);
    return [];
  }
}

async function getBanners() {
  try {
    const { isReady } = await ensureDbReady();
    if (!isReady) return [];
    const rawBanners = await Banner.find({ isActive: true }).sort({ order: 1 }).lean();
    return JSON.parse(JSON.stringify(rawBanners));
  } catch (err) {
    console.error("Failed to load banners:", err);
    return [];
  }
}

async function getTrustBadges() {
  try {
    const { isReady } = await ensureDbReady();
    if (!isReady) return DEFAULT_TRUST_BADGES;
    const doc = await Settings.findOne({ key: "trust_badges" }).lean();
    return doc ? (doc.value as any[]) : DEFAULT_TRUST_BADGES;
  } catch (err) {
    console.error("Failed to load trust badges:", err);
    return DEFAULT_TRUST_BADGES;
  }
}

async function getActiveFlashSale() {
  try {
    const { isReady } = await ensureDbReady();
    if (!isReady) return null;
    const now = new Date();
    const sale = await FlashSale.findOne({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    })
      .populate({
        path: "products",
        model: Product,
        populate: [
          { path: "category", model: Category },
          { path: "brand", model: Brand },
        ],
      })
      .lean();

    if (!sale) return null;
    const normalizedProducts = (sale.products || []).map((p: any) => normalizeProduct(p));
    return {
      _id: sale._id.toString(),
      discountType: sale.discountType as "PERCENTAGE" | "FLAT",
      discountValue: sale.discountValue,
      endTime: sale.endTime.toISOString(),
      products: normalizedProducts,
    };
  } catch (err) {
    console.error("Failed to load active flash sale:", err);
    return null;
  }
}

export default async function Home() {
  const [featured, newest, trustBadges, banners, activeSale] = await Promise.all([
    getFeaturedProducts(),
    getNewArrivalProducts(),
    getTrustBadges(),
    getBanners(),
    getActiveFlashSale(),
  ]);

  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "ShoeStore",
    name: "CosstechCom",
    image: "https://rbh.maurya-tech.com/rbh-logo.png",
    description:
      "Multi-vendor footwear marketplace. Offers a wide range of premium footwear for men, women, and children from various sellers, brands, and categories.",
    url: "https://rbh.maurya-tech.com",
    telephone: "+916263638053",
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Main Footwear Market",
      addressLocality: "Gorakhpur",
      addressRegion: "Uttar Pradesh",
      postalCode: "273001",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 26.7606,
      longitude: 83.3731,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "21:00",
    },
    sameAs: ["https://wa.me/916263638053"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      <Hero initialBanners={banners} />

      {/* Trust Badges section */}
      <section className="border-y border-border bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border/60">
            {trustBadges.map((badge, index) => {
              const IconComponent = ICON_MAP[badge.icon] || HelpCircle;
              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-3 px-4 md:px-6 py-4 text-center sm:text-left group"
                >
                  <div className="h-10 w-10 rounded-xl bg-cognac/10 border border-cognac/20 flex items-center justify-center shrink-0 group-hover:bg-cognac/15 transition-colors">
                    <IconComponent className="h-5 w-5 text-cognac" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-charcoal tracking-wide">
                      {badge.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                      {badge.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Countdown Flash Deals */}
      <CountdownSale sale={activeSale} />

      {/* Dynamic Style Categories */}
      <CategoryGrid />

      {/* Brand Logos Infinite sliding Marquee */}
      <BrandMarquee />

      {/* Bestsellers Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-cognac font-semibold mb-2">
              The Atelier
            </p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-charcoal">Bestsellers</h2>
          </div>
          <Link
            href="/shop"
            className="hidden md:inline text-sm font-semibold underline underline-offset-4 hover:text-primary transition"
          >
            Shop all
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground">Couldn't load featured products.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Occasion-based collections Showcase Grid */}
      <OccasionGrid occasions={OCCASIONS} />

      {/* Brand Editorial split */}
      <EditorialBanner newest={newest} />

      {/* New Arrivals Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-cognac font-semibold mb-2">
              Fresh from the bench
            </p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-charcoal">
              New arrivals
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden md:inline text-sm font-semibold underline underline-offset-4 hover:text-primary transition"
          >
            Shop all
          </Link>
        </div>

        {newest.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground">Couldn't load new arrivals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newest.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Recently Viewed Styles */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <RecentlyViewed />
      </div>

      {/* Premium Newsletter Sign-up */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
        <div className="relative bg-charcoal text-cream rounded-3xl p-8 md:p-14 text-center max-w-3xl mx-auto overflow-hidden shadow-elevated">
          {/* Decorative gradient orbs */}
          <div className="absolute -top-10 -left-10 h-48 w-48 rounded-full bg-brass/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-cognac/20 blur-3xl pointer-events-none" />
          {/* Grain texture */}
          <div className="absolute inset-0 grain opacity-10 pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-block mb-4 px-4 py-1.5 bg-brass/15 border border-brass/25 text-brass text-[10px] uppercase tracking-[0.3em] font-bold rounded-full">
              CosstechCom Club
            </span>
            <h3 className="font-serif text-3xl md:text-4xl font-bold text-cream mt-1">
              Members Get Exclusive Benefits
            </h3>
            <p className="text-sm text-cream/60 mt-3 max-w-md mx-auto leading-relaxed">
              Join to receive early access to deals, flash sale alerts, premium brand launches, and
              exclusive loyalty discount rewards.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-5 mb-6">
              {["Early Access", "10% Festive Discount", "New Arrivals", "Size Notifications"].map(
                (perk) => (
                  <span
                    key={perk}
                    className="text-[10px] font-bold px-3 py-1 rounded-full bg-cream/10 border border-cream/20 text-cream/70"
                  >
                    ✦ {perk}
                  </span>
                ),
              )}
            </div>
            <NewsletterFormClient />
          </div>
        </div>
      </section>
    </>
  );
}
