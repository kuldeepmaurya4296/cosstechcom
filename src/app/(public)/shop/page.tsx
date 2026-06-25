import React, { Suspense } from "react";
import { Metadata } from "next";
import mongoose from "mongoose";
import { ensureDbReady, normalizeProduct } from "@/lib/db-utils";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Category";
import Brand from "@/lib/models/Brand";
import User from "@/lib/models/User";
import ShopClient from "@/modules/products/components/ShopClient";
import { unstable_cache } from "next/cache";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    occasion?: string;
    search?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    size?: string;
    limit?: string;
    gender?: string;
    color?: string;
    collection?: string;
    vendor?: string;
    discount?: string;
    availability?: string;
  }>;
}

function escapeRegExp(string: string) {
  return string.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
}

const getFilterMetadata = unstable_cache(
  async () => {
    const { isReady } = await ensureDbReady();
    if (!isReady) {
      return {
        brands: [],
        sizes: [],
        occasions: [],
        colors: [],
        genders: [],
        maxPrice: 5000,
        vendors: [],
      };
    }

    try {
      const brandIds = await Product.distinct("brand", { isActive: true });
      const activeBrands = await Brand.find({ _id: { $in: brandIds.filter(Boolean) } })
        .select("name")
        .lean();
      const sortedBrands = activeBrands.map((b: any) => b.name).sort();

      const sizesAgg = await Product.aggregate([
        { $match: { isActive: true } },
        { $unwind: "$variants" },
        { $group: { _id: null, sizes: { $addToSet: "$variants.size" } } },
      ]);
      const sortedSizes = (sizesAgg[0]?.sizes ?? [])
        .filter((s: any) => s !== null && s !== undefined)
        .map((s: any) => String(s))
        .sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }));

      const occasions = await Product.distinct("occasion", { isActive: true });
      const sortedOccasions = occasions.filter(Boolean).sort();

      const genders = await Product.distinct("gender", { isActive: true });
      const sortedGenders = genders.filter(Boolean).sort();

      const colorsAgg = await Product.aggregate([
        { $match: { isActive: true } },
        { $unwind: "$variants" },
        {
          $group: {
            _id: { $toLower: "$variants.color" },
            name: { $first: "$variants.color" },
            hex: { $first: "$variants.colorHex" },
          },
        },
      ]);
      const sortedColors = colorsAgg
        .map((c: any) => ({ name: c.name, hex: c.hex }))
        .filter((c: any) => c.name)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      const maxPriceProduct = await Product.findOne({ isActive: true })
        .sort({ salePrice: -1 })
        .select("salePrice")
        .lean();
      const maxPrice = maxPriceProduct?.salePrice ?? 5000;

      const vendorIds = await Product.distinct("vendorId", { isActive: true });
      const activeVendors = await User.find({ _id: { $in: vendorIds.filter(Boolean) } })
        .select("_id storeName name")
        .lean();
      const sortedVendors = activeVendors
        .map((v: any) => ({
          id: v._id.toString(),
          name: v.storeName || v.name,
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      return {
        brands: sortedBrands,
        sizes: sortedSizes,
        occasions: sortedOccasions,
        colors: sortedColors,
        genders: sortedGenders,
        maxPrice,
        vendors: sortedVendors,
      };
    } catch (err) {
      console.error("Failed to generate filter metadata:", err);
      return {
        brands: [],
        sizes: [],
        occasions: [],
        colors: [],
        genders: [],
        maxPrice: 5000,
        vendors: [],
      };
    }
  },
  ["shop-filter-metadata"],
  {
    revalidate: 3600,
    tags: ["filter-metadata"],
  },
);

async function getShopDataImpl(filters: any) {
  const { isReady } = await ensureDbReady();
  if (!isReady) {
    console.warn("Database connection is not ready. Returning empty shop catalog data.");
    return {
      categories: [],
      products: [],
      total: 0,
    };
  }

  const {
    category,
    brand,
    occasion,
    search,
    sort,
    minPrice,
    maxPrice,
    size,
    limit,
    gender,
    color,
    collection,
    vendor,
    discount,
    availability,
  } = filters;
  const currentLimit = parseInt(limit || "8", 10);

  // 1. Fetch active categories directly (eliminating expensive distinct scan on Product collection)
  const categoriesList = await Category.find({ isActive: true }).sort({ name: 1 }).lean();

  // 2. Fetch products
  let query: any = { isActive: true };

  // Collection filter
  if (collection) {
    const Collection =
      mongoose.models.Collection || (await import("@/lib/models/Collection")).default;
    const collectionDoc = await Collection.findOne({ slug: collection, isActive: true });
    if (collectionDoc) {
      query._id = { $in: collectionDoc.products };
    } else {
      query._id = new mongoose.Types.ObjectId(); // force empty results
    }
  }

  if (category && category !== "all") {
    const categoryDoc = await Category.findOne({ slug: category });
    if (categoryDoc) {
      query.category = categoryDoc._id;
    } else {
      query.category = new mongoose.Types.ObjectId(); // force empty results
    }
  }

  if (brand) {
    const brandNames = brand.split(",").map((b: string) => b.trim());
    const matchedBrands = await Brand.find({
      name: { $in: brandNames.map((b: string) => new RegExp(`^${escapeRegExp(b)}$`, "i")) },
    })
      .select("_id")
      .lean();
    const brandIds = matchedBrands.map((b: any) => b._id);
    query.brand = { $in: brandIds };
  }

  if (occasion) {
    query.occasion = occasion;
  }

  if (search) {
    const regex = new RegExp(escapeRegExp(search), "i");
    const matchedBrands = await Brand.find({ name: regex }).select("_id").lean();
    const brandIds = matchedBrands.map((b: any) => b._id);

    query.$or = [{ name: regex }, { description: regex }, { tags: regex }];
    if (brandIds.length > 0) {
      query.$or.push({ brand: { $in: brandIds } });
    }
  }

  if (minPrice || maxPrice) {
    query.salePrice = {};
    if (minPrice) {
      query.salePrice.$gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      query.salePrice.$lte = parseFloat(maxPrice);
    }
  }

  if (vendor) {
    const vendorIds = vendor.split(",").map((v: string) => v.trim()).filter(Boolean);
    if (vendorIds.length > 0) {
      query.vendorId = { $in: vendorIds.map((id: string) => new mongoose.Types.ObjectId(id)) };
    }
  }

  if (discount) {
    const minDiscount = parseFloat(discount);
    if (!isNaN(minDiscount)) {
      query.discount = { $gte: minDiscount };
    }
  }

  if (gender) {
    const genderArray = gender
      .split(",")
      .map((g: string) => new RegExp(`^${escapeRegExp(g.trim())}$`, "i"));
    query.gender = { $in: genderArray };
  }

  const variantConditions: any = { stock: { $gt: 0 } };
  let hasVariantQuery = false;

  if (size) {
    const sizeArray = size.split(",").map((s: string) => s.trim());
    variantConditions.size = { $in: sizeArray };
    hasVariantQuery = true;
  }

  if (color) {
    const colorArray = color
      .split(",")
      .map((c: string) => new RegExp(`^${escapeRegExp(c.trim())}$`, "i"));
    variantConditions.color = { $in: colorArray };
    hasVariantQuery = true;
  }

  if (availability === "in_stock") {
    hasVariantQuery = true;
  }

  if (hasVariantQuery) {
    query.variants = {
      $elemMatch: variantConditions,
    };
  }

  const total = await Product.countDocuments(query);
  let mongooseQuery = Product.find(query)
    .populate({ path: "category", model: Category })
    .populate({ path: "brand", model: Brand });

  if (sort === "low") {
    mongooseQuery = mongooseQuery.sort({ salePrice: 1 });
  } else if (sort === "high") {
    mongooseQuery = mongooseQuery.sort({ salePrice: -1 });
  } else if (sort === "rating") {
    mongooseQuery = mongooseQuery.sort({ "rating.average": -1 });
  } else {
    mongooseQuery = mongooseQuery.sort({ createdAt: -1 });
  }

  const rawProducts = await mongooseQuery.limit(currentLimit).lean().exec();
  const products = rawProducts.map((p: any) => normalizeProduct(p));

  return {
    categories: JSON.parse(JSON.stringify(categoriesList)),
    products,
    total,
  };
}

// Cache per filter combination so repeat category/brand/sort views are served
// from cache instead of re-querying Mongo on every header-tab navigation.
// Key includes the serialized filters, so each combo caches independently.
async function getShopData(filters: any) {
  return unstable_cache(
    () => getShopDataImpl(filters),
    ["shop-data", JSON.stringify(filters ?? {})],
    {
      revalidate: 120,
      tags: ["shop-data"],
    },
  )();
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { category, search } = await searchParams;
  let title = "Footwear Catalog — CosstechCom";
  let description = "Browse our exclusive footwear collections from verified vendors.";

  if (category && category !== "all") {
    title = `${category.charAt(0).toUpperCase() + category.slice(1)} Footwear — CosstechCom`;
  }
  if (search) {
    title = `Search results for "${search}" — CosstechCom`;
  }

  let canonicalPath = "/shop";
  if (category && category !== "all") {
    canonicalPath = `/shop?category=${category}`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
  };
}

export default async function ShopPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const [data, filterMetadata] = await Promise.all([getShopData(filters), getFilterMetadata()]);

  const { category } = filters;
  let canonicalPath = "/shop";
  if (category && category !== "all") {
    canonicalPath = `/shop?category=${category}`;
  }

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name:
      category && category !== "all"
        ? `${category.charAt(0).toUpperCase() + category.slice(1)} Products`
        : "Products Catalog",
    description: "Browse our premium products collection at CosstechCom.",
    url: `https://cosstechcom.maurya-tech.com${canonicalPath}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: data.total,
      itemListElement: data.products.slice(0, 12).map((product: any, idx: number) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `https://cosstechcom.maurya-tech.com/shop/${product.slug}`,
      })),
    },
  };

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://cosstechcom.maurya-tech.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: "https://cosstechcom.maurya-tech.com/shop",
      },
      ...(category && category !== "all"
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: category.charAt(0).toUpperCase() + category.slice(1),
              item: `https://cosstechcom.maurya-tech.com/shop?category=${category}`,
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <Suspense
        fallback={
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground text-sm font-semibold">
              Loading catalog styles...
            </p>
          </div>
        }
      >
        <ShopClient
          categories={data.categories}
          initialProducts={data.products}
          totalProducts={data.total}
          filterMetadata={filterMetadata}
        />
      </Suspense>
    </>
  );
}
