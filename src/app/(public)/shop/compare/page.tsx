import React from "react";
import { ensureDbReady, normalizeProduct } from "@/lib/db-utils";
import Product from "@/lib/models/Product";
import Brand from "@/lib/models/Brand";
import Category from "@/lib/models/Category";
import { CompareClient } from "./CompareClient";

export const metadata = {
  title: "Compare Products — CosstechCom",
  description: "Compare specifications, prices, and features of premium items side-by-side.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ slugs?: string }>;
}) {
  const { slugs } = await searchParams;
  const slugArray = slugs ? slugs.split(",").filter(Boolean) : [];

  let comparedProducts: any[] = [];

  if (slugArray.length > 0) {
    try {
      const { isReady } = await ensureDbReady();
      if (isReady) {
        const rawProducts = await Product.find({
          slug: { $in: slugArray },
          isActive: true,
        })
          .populate({ path: "brand", model: Brand })
          .populate({ path: "category", model: Category })
          .lean();

        comparedProducts = rawProducts.map((p) => normalizeProduct(p));
      }
    } catch (err) {
      console.error("Failed to fetch comparison products:", err);
    }
  }

  return (
    <div className="min-h-screen bg-cream/30">
      <CompareClient initialProducts={comparedProducts} />
    </div>
  );
}
