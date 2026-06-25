"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";
import { useSession } from "next-auth/react";

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string | number;
  color: string;
  quantity: number;
  slug: string;
}

interface CartCtx {
  lines: CartLine[];
  wishlist: string[];
  add: (p: Product, opts: { size: string | number; color: string; quantity?: number }) => void;
  remove: (key: string) => void;
  setQty: (key: string, q: number) => void;
  clear: () => void;
  toggleWish: (id: string) => void;
  count: number;
  subtotal: number;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "coss-cart-v1";
const WKEY = "coss-wish-v1";
const lineKey = (l: { productId: string; size: string | number; color: string }) =>
  `${l.productId}-${l.size}-${l.color}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const c = localStorage.getItem(KEY);
      if (c) setLines(JSON.parse(c));
      const w = localStorage.getItem(WKEY);
      if (w) setWishlist(JSON.parse(w));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines]);
  useEffect(() => {
    try {
      localStorage.setItem(WKEY, JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  // Fetch cart from database on login if local cart is empty
  useEffect(() => {
    if (status === "authenticated" && lines.length === 0) {
      const fetchCart = async () => {
        try {
          const res = await fetch("/api/user/cart");
          if (res.ok) {
            const data = await res.json();
            if (data && data.items && data.items.length > 0) {
              const formattedLines = data.items.map((item: any) => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                image: item.image,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                slug: item.slug,
                vendorId: item.vendorId,
                vendorName: item.vendorName,
              }));
              setLines(formattedLines);
            }
          }
        } catch (err) {
          console.error("Failed to fetch cart on auth:", err);
        }
      };
      fetchCart();
    }
  }, [status, lines.length]);

  // Debounced cart sync to database
  useEffect(() => {
    if (status === "authenticated") {
      const syncCart = async () => {
        try {
          await fetch("/api/user/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lines }),
          });
        } catch (err) {
          console.error("Failed to sync cart:", err);
        }
      };

      const timer = setTimeout(syncCart, 1500); // Debounce 1.5s
      return () => clearTimeout(timer);
    }
  }, [lines, status]);

  // Sync wishlist on login
  useEffect(() => {
    if (status === "authenticated") {
      const syncWishlist = async () => {
        try {
          const localWish = JSON.parse(localStorage.getItem(WKEY) || "[]");
          const res = await fetch("/api/user/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds: localWish }),
          });
          if (res.ok) {
            const merged = await res.json();
            setWishlist(merged);
          }
        } catch (err) {
          console.error("Wishlist sync failed:", err);
        }
      };
      syncWishlist();
    }
  }, [status]);

  const add: CartCtx["add"] = (p, { size, color, quantity = 1 }) => {
    setLines((prev) => {
      const k = lineKey({ productId: p.id, size, color });
      const idx = prev.findIndex((l) => lineKey(l) === k);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          size,
          color,
          quantity,
          slug: p.slug,
        },
      ];
    });
  };

  const remove: CartCtx["remove"] = (key) =>
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  const setQty: CartCtx["setQty"] = (key, q) =>
    setLines((prev) =>
      prev.map((l) => (lineKey(l) === key ? { ...l, quantity: Math.max(1, q) } : l)),
    );
  const clear = () => setLines([]);

  const toggleWish: CartCtx["toggleWish"] = async (id) => {
    if (status === "authenticated") {
      try {
        const res = await fetch("/api/user/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: id }),
        });
        if (res.ok) {
          const data = await res.json();
          setWishlist(data);
        }
      } catch (err) {
        console.error("Failed to toggle wishlist on server:", err);
      }
    } else {
      setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }
  };

  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  return (
    <Ctx.Provider
      value={{ lines, wishlist, add, remove, setQty, clear, toggleWish, count, subtotal }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
};
export { lineKey };
