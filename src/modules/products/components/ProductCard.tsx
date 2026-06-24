"use client";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/data/products";
import { formatINR } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import Image from "next/image";

const MotionImage = motion(Image);

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { wishlist, toggleWish, add } = useCart();
  const wished = wishlist.includes(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group"
    >
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <MotionImage
            src={product.image}
            alt={product.name}
            width={380}
            height={380}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          {(product as any).flashSale ? (
            <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-600 text-white animate-pulse shadow-sm z-10">
              ⚡ Flash Sale
            </span>
          ) : (
            product.badge && (
              <span
                className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                  product.badge === "sale"
                    ? "bg-destructive text-destructive-foreground"
                    : product.badge === "new"
                      ? "bg-accent text-accent-foreground"
                      : "bg-charcoal text-cream"
                }`}
              >
                {product.badge}
              </span>
            )
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWish(product.id);
            }}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-cream/90 backdrop-blur grid place-items-center hover:bg-cream transition z-10 cursor-pointer border-0"
            aria-label="Wishlist"
          >
            <Heart
              className={`h-4 w-4 transition ${wished ? "fill-primary text-primary" : "text-charcoal"}`}
            />
          </button>

          {/* Add to Cart button overlay */}
          <div className="absolute inset-x-3 bottom-3 md:translate-y-12 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const defaultSize = product.sizes?.[0] || 7;
                const defaultColor = product.colors?.[0] || "Default";
                add(product, { size: defaultSize, color: defaultColor, quantity: 1 });
                toast.success(`Added ${product.name} to cart!`, {
                  description: `Size: UK/IND ${defaultSize} · Color: ${defaultColor}`,
                });
              }}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-0"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {product.category}
          </p>
          <h3 className="font-serif text-base font-medium text-foreground leading-snug">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-sm font-bold ${(product as any).flashSale ? "text-red-600" : "text-foreground"}`}
            >
              {formatINR(product.price)}
            </span>
            {product.compareAt && (
              <span className="text-xs text-muted-foreground line-through">
                {formatINR(product.compareAt)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
