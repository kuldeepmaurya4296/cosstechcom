"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Heart, ShoppingBag, Star, ChevronRight, Share2, Package, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { formatINR } from "@/lib/format";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

// Sub-components
import { ProductGallery } from "@/modules/products/components/ProductGallery";
import { SizeSelector } from "@/modules/products/components/SizeSelector";
import { ColorSelector } from "@/modules/products/components/ColorSelector";
import { TrustBadges } from "@/components/public/TrustBadges";
import { ReviewsSection } from "@/modules/reviews/components/ReviewsSection";
import { QuantitySelector } from "@/components/shared/QuantitySelector";
import { ShareButton } from "@/modules/products/components/ShareButton";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { RecentlyViewed } from "@/components/public/RecentlyViewed";

/** Lightweight HTML sanitizer — strips scripts, event handlers, and dangerous URIs */
function sanitizeHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "")
    .replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/javascript\s*:/gi, "blocked:")
    .replace(/data\s*:\s*text\/html/gi, "blocked:");
}

function FlashSaleCountdown({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(endTime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200/60 text-red-700 px-4 py-3 rounded-2xl w-fit shadow-2xs">
      <span className="text-[10px] font-extrabold uppercase tracking-widest animate-pulse flex items-center gap-1">
        <span>⚡</span> Ends In:
      </span>
      <div className="flex items-center gap-1 font-mono text-xs font-black">
        <span className="bg-red-600 text-white px-2 py-1 rounded-lg shadow-sm">
          {String(timeLeft.hours).padStart(2, "0")}h
        </span>
        <span className="text-red-400 font-bold">:</span>
        <span className="bg-red-600 text-white px-2 py-1 rounded-lg shadow-sm">
          {String(timeLeft.minutes).padStart(2, "0")}m
        </span>
        <span className="text-red-400 font-bold">:</span>
        <span className="bg-red-600 text-white px-2 py-1 rounded-lg shadow-sm">
          {String(timeLeft.seconds).padStart(2, "0")}s
        </span>
      </div>
    </div>
  );
}

interface ProductClientProps {
  product: any;
  initialReviews: any[];
  relatedProducts: any[];
}

export default function ProductClient({
  product,
  initialReviews,
  relatedProducts,
}: ProductClientProps) {
  const router = useRouter();
  const { add, wishlist, toggleWish } = useCart();
  const [size, setSize] = useState<string | number | null>(null);
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [addingToBag, setAddingToBag] = useState(false);
  const { addProduct } = useRecentlyViewed();

  // Dynamic styling and label logic based on category/tags
  const categorySlug = String(product.category || "").toLowerCase();
  const tagsList = (product.tags || []).map((t: string) => t.toLowerCase());

  const isFootwear = categorySlug.includes("footwear") || 
                     categorySlug.includes("shoes") || 
                     tagsList.includes("shoes") || 
                     tagsList.includes("footwear");
  
  const isFashion = categorySlug.includes("fashion") || 
                    categorySlug.includes("apparel") || 
                    categorySlug.includes("clothing") ||
                    tagsList.includes("clothing") ||
                    tagsList.includes("fashion");

  const isGrocery = categorySlug.includes("grocery") || 
                    categorySlug.includes("staples") || 
                    categorySlug.includes("beverage") ||
                    tagsList.includes("grocery") ||
                    tagsList.includes("rice") ||
                    tagsList.includes("tea");

  const isElectronics = categorySlug.includes("electronics") || 
                        categorySlug.includes("phone") || 
                        categorySlug.includes("mobiles") || 
                        categorySlug.includes("laptops") ||
                        tagsList.includes("electronics");

  const sizeLabel = useMemo(() => {
    if (isFootwear) return "Size (UK/IND)";
    if (isFashion) return "Size";
    if (isGrocery) return "Pack Size";
    if (isElectronics) return "Configuration";
    return "Option";
  }, [isFootwear, isFashion, isGrocery, isElectronics]);

  const showSizeGuide = isFootwear;

  // Map color names to their corresponding hex values from variants
  const colorsWithHex = useMemo(() => {
    const map = new Map<string, string>();
    if (product.variants) {
      product.variants.forEach((v: any) => {
        if (v.color && v.colorHex) {
          map.set(v.color.toLowerCase(), v.colorHex);
        }
      });
    }
    return (product.colors || []).map((c: string) => ({
      name: c,
      hex: map.get(c.toLowerCase()) || "#cccccc",
    }));
  }, [product.colors, product.variants]);

  // Find which sizes are actually available (stock > 0) for the selected color
  const availableSizesForColor = useMemo(() => {
    if (!color || !product.variants) return [];
    return product.variants
      .filter((v: any) => v.color?.toLowerCase() === color.toLowerCase() && v.stock > 0)
      .map((v: any) => v.size);
  }, [color, product.variants]);

  // Find the exact variant matching the selected color and size
  const selectedVariant = useMemo(() => {
    if (!color || !size || !product.variants) return null;
    return product.variants.find(
      (v: any) => v.color?.toLowerCase() === color.toLowerCase() && v.size === size,
    );
  }, [color, size, product.variants]);

  // Find if there's any variant matching the selected color that has custom images
  const activeGallery = useMemo(() => {
    if (!color || !product.variants) return product.gallery;
    const match = product.variants.find(
      (v: any) => v.color?.toLowerCase() === color.toLowerCase() && v.images && v.images.length > 0,
    );
    if (match) {
      return match.images.map((img: any) => img.url);
    }
    return product.gallery;
  }, [color, product.gallery, product.variants]);

  useEffect(() => {
    if (product && !color && product.colors?.length > 0) {
      setColor(product.colors[0]);
    }
  }, [product, color]);

  // If color changes and currently selected size is not available, reset size selection
  useEffect(() => {
    if (color && size !== null && !availableSizesForColor.includes(size)) {
      setSize(null);
    }
  }, [color, availableSizesForColor, size]);

  useEffect(() => {
    if (product) {
      addProduct(product);
    }
  }, [product, addProduct]);

  const wished = wishlist.includes(product.id);

  const discountPercent =
    product.compareAt && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : null;

  const isOutOfStock = size !== null && selectedVariant && selectedVariant.stock <= 0;
  const isLowStock =
    size !== null && selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5;

  const handleAdd = async () => {
    if (product.sizes?.length > 0 && !size) {
      toast.error(`Please select a ${sizeLabel.toLowerCase()} before adding to bag`);
      return;
    }
    if (isOutOfStock) {
      toast.error("This option is out of stock");
      return;
    }
    setAddingToBag(true);
    await new Promise((r) => setTimeout(r, 400));
    add(product, { size: size || "", color, quantity: qty });
    setAddingToBag(false);
    router.push("/cart");
  };

  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<{ checked: boolean; success: boolean; msg: string } | null>(null);
  const [qas, setQas] = useState([
    { q: "Is the product eligible for return or exchange?", a: "Yes! All products are eligible for exchange or return within 7 days of delivery if in original unused condition." },
    { q: "Are the colors shown exactly the same as physical product?", a: "We take product photos under studio lighting. There might be a slight variance in shade but they are 95%+ identical." },
  ]);
  const [newQuestion, setNewQuestion] = useState("");

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{6}$/.test(pincode.trim())) {
      const days = product.estimatedDeliveryDays || 5;
      setDeliveryStatus({
        checked: true,
        success: true,
        msg: `Delivery available. Est. delivery within ${days} days! COD eligible.`,
      });
    } else {
      setDeliveryStatus({
        checked: true,
        success: false,
        msg: "Please enter a valid 6-digit PIN code (e.g. 273001).",
      });
    }
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    toast.success("Question submitted! It will appear once approved by the seller.");
    setNewQuestion("");
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
        <Link href="/shop" className="hover:text-primary transition-colors">
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            <Link
              href={`/shop?category=${product.category}`}
              className="hover:text-primary transition-colors capitalize"
            >
              {product.category}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
        <span className="text-foreground font-medium truncate max-w-[160px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 md:gap-14 lg:gap-20">
        {/* Gallery */}
        <ProductGallery gallery={activeGallery} name={product.name} />

        {/* Info Panel */}
        <div className="space-y-5">
          {/* Product header */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-cognac font-bold mb-1.5">
                  {product.brand || product.category}
                </p>
                <h1 className="font-serif text-2xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  {product.name}
                </h1>
              </div>
              <ShareButton productName={product.name} productBrand={product.brand} />
            </div>

            {/* Rating Row */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.round(product.rating) ? "fill-brass text-brass" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {product.rating} · {product.reviewsCount} reviews
              </span>
            </div>

            {/* Price Block */}
            <div className="mt-4 flex items-baseline gap-3">
              <span
                className={`font-serif text-3xl md:text-4xl font-bold ${product.flashSale ? "text-red-600" : "text-primary"}`}
              >
                {formatINR(product.price)}
              </span>
              {product.compareAt && (
                <span className="text-muted-foreground line-through text-base">
                  {formatINR(product.compareAt)}
                </span>
              )}
              {product.flashSale ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-600 text-xs font-bold rounded-full border border-red-500/20 whitespace-nowrap">
                  ⚡ FLASH DEAL (
                  {product.flashSale.discountType === "PERCENTAGE"
                    ? `${product.flashSale.discountValue}%`
                    : `-${formatINR(product.flashSale.discountValue)}`}
                  )
                </span>
              ) : (
                discountPercent && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-full border border-emerald-500/20 whitespace-nowrap">
                    <Sparkles className="h-3 w-3" />
                    {discountPercent}% OFF
                  </span>
                )
              )}
            </div>

            {product.flashSale && (
              <div className="mt-3">
                <FlashSaleCountdown endTime={product.flashSale.endTime} />
              </div>
            )}

            {/* Description */}
            <div
              className="mt-4 text-sm text-muted-foreground leading-relaxed prose prose-stone max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border/60" />

          {/* Color Selector */}
          <ColorSelector colors={colorsWithHex} selectedColor={color} onSelect={setColor} />

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <SizeSelector
              sizes={product.sizes}
              selectedSize={size}
              onSelect={setSize}
              availableSizes={availableSizesForColor}
              label={sizeLabel}
              showSizeGuide={showSizeGuide}
            />
          )}

          {/* Stock Feedback */}
          {size !== null && selectedVariant && (
            <div className="text-xs font-semibold animate-in fade-in duration-200 px-3 py-2 rounded-lg inline-flex items-center gap-2 border w-fit">
              {isOutOfStock ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-destructive">Out of stock — notify me</span>
                </>
              ) : isLowStock ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-cognac animate-pulse" />
                  <span className="text-cognac">
                    Only {selectedVariant.stock} left — order soon!
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600">In stock · Ready to ship</span>
                </>
              )}
            </div>
          )}

          {/* Qty + CTA Row */}
          <div className="flex gap-3 items-center pt-1">
            <QuantitySelector quantity={qty} onChange={setQty} />
            <button
              onClick={handleAdd}
              disabled={!!isOutOfStock || addingToBag}
              className="flex-1 bg-primary text-primary-foreground rounded-full h-12 font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {addingToBag ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  {isOutOfStock ? "Out of Stock" : "Add to Bag"}
                </>
              )}
            </button>
            <button
              onClick={() => toggleWish(product.id)}
              className={`h-12 w-12 grid place-items-center border rounded-full hover:bg-muted transition cursor-pointer shrink-0 ${wished ? "border-primary bg-primary/5" : "border-border"}`}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`h-4 w-4 ${wished ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>

          {/* PIN Delivery Checker */}
          <div className="border-t border-border/60 pt-5 space-y-2.5">
            <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-cognac" />
              Delivery & Services
            </h3>
            <form onSubmit={handleCheckPincode} className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Enter 6-digit Pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                className="bg-cream border border-border/80 rounded-xl px-3 py-2 text-xs flex-1 outline-none focus:border-cognac transition"
              />
              <button
                type="submit"
                className="bg-charcoal text-cream hover:bg-cognac px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Check
              </button>
            </form>
            {deliveryStatus && (
              <p className={`text-xs font-medium mt-1 ${deliveryStatus.success ? "text-emerald-600" : "text-destructive"}`}>
                {deliveryStatus.success ? "✓ " : "✗ "}
                {deliveryStatus.msg}
              </p>
            )}
          </div>

          {/* Seller Card */}
          <div className="bg-brass/5 border border-brass/15 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-brass tracking-wider">Sold & Fulfilled By</span>
                <h4 className="text-sm font-bold text-charcoal mt-0.5">
                  {product.vendorStoreName || product.vendorName || "CosstechCom Verified Seller"}
                </h4>
              </div>
              {product.vendorId && (
                <Link
                  href={`/shop?vendor=${product.vendorId}`}
                  className="bg-charcoal hover:bg-cognac text-cream text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  Visit Store
                </Link>
              )}
            </div>
            <div className="flex gap-3 text-[10px] text-muted-foreground font-semibold">
              <span className="flex items-center gap-1 bg-cream px-2 py-1 rounded-md border border-border/40">⭐ 4.8 Seller Rating</span>
              <span className="flex items-center gap-1 bg-cream px-2 py-1 rounded-md border border-border/40">🚚 99% Fast Dispatch</span>
            </div>
          </div>

          {/* Specifications Table */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="border-t border-border/60 pt-5 space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">
                Specifications
              </h3>
              <div className="border border-border/50 rounded-2xl overflow-hidden bg-muted/10">
                <table className="w-full text-xs text-left divide-y divide-border/40">
                  <tbody className="divide-y divide-border/40">
                    {product.specifications.map((spec: any) => (
                      <tr key={spec.key} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-charcoal w-1/3 border-r border-border/40 bg-muted/20">{spec.key}</td>
                        <td className="px-4 py-3 text-muted-foreground">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Crafted Details */}
          {product.details?.length > 0 && (
            <div className="border-t border-border/60 pt-5 space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">
                Crafted With
              </h3>
              <ul className="space-y-1.5">
                {product.details.map((d: any) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-cognac font-bold mt-0.5">·</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Q&A Widget */}
          <div className="border-t border-border/60 pt-5 space-y-4">
            <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">
              Questions & Answers
            </h3>
            <div className="space-y-3.5">
              {qas.map((qa, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-xs font-bold text-charcoal">Q: {qa.q}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">A: {qa.a}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddQuestion} className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Have a question? Ask the seller..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="bg-cream border border-border/80 rounded-xl px-3 py-2 text-xs flex-1 outline-none focus:border-cognac transition"
              />
              <button
                type="submit"
                className="bg-charcoal text-cream hover:bg-cognac px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Ask
              </button>
            </form>
          </div>

          {/* Trust Badges */}
          <TrustBadges />
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewsSection reviews={initialReviews} productId={product.id} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 md:mt-24 border-t border-border pt-12">
          <div className="flex items-baseline justify-between mb-6 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-cognac font-bold mb-1">
                You May Also Like
              </p>
              <h2 className="font-serif text-2xl md:text-3xl font-bold">
                Complete Your Collection
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-primary hover:underline underline-offset-2 shrink-0 flex items-center gap-1"
            >
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Products */}
      <RecentlyViewed excludeProductId={product.id} />
    </div>
  );
}
