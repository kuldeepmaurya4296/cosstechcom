"use client";

import { useState, useEffect, useCallback } from "react";

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  price: number;
  compareAt?: number;
  image: string;
  slug: string;
  rating: number;
  reviewsCount: number;
  brand?: string;
  category?: string;
}

const STORAGE_KEY = "coss-recently-viewed";
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [list, setList] = useState<RecentlyViewedProduct[]>([]);

  // Load initial list from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setList(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load recently viewed products:", err);
    }
  }, []);

  const addProduct = useCallback((product: any) => {
    if (!product || !product.id) return;

    setList((prevList) => {
      const newItem: RecentlyViewedProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        compareAt: product.compareAt,
        image: product.gallery?.[0] || product.image || "",
        slug: product.slug,
        rating: product.rating || 5,
        reviewsCount: product.reviewsCount || 0,
        brand: product.brand,
        category: product.category,
      };

      // Filter out duplicate and insert at beginning
      const filtered = prevList.filter((item) => item.id !== product.id);
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save recently viewed products:", err);
      }

      return updated;
    });
  }, []);

  const clearList = useCallback(() => {
    setList([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Failed to clear recently viewed products:", err);
    }
  }, []);

  return {
    recentlyViewed: list,
    addProduct,
    clearList,
  };
}
