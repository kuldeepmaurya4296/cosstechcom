import React from "react";
import { Metadata } from "next";
import Product from "@/lib/models/Product";
import Review from "@/lib/models/Review";
import Category from "@/lib/models/Category";
import Brand from "@/lib/models/Brand";
import User from "@/lib/models/User"; // needed for reviews user populate
import { ensureDbReady, normalizeProduct } from "@/lib/db-utils";
import { applyFlashSaleToSingleProduct } from "@/lib/flash-sale-utils";
import ProductClient from "@/modules/products/components/ProductClient";
import Link from "next/link";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export const revalidate = 3600;

async function getProductData(productId: string) {
  const { isReady } = await ensureDbReady();
  if (!isReady) {
    console.warn("Database connection is not ready. Returning null product data.");
    return null;
  }

  // Try finding by slug first, then by ObjectId id
  let productDoc = await Product.findOne({ slug: productId, isActive: true })
    .populate({ path: "category", model: Category })
    .populate({ path: "brand", model: Brand })
    .populate({ path: "vendorId", model: User, select: "name storeName email" });
  if (!productDoc && productId.match(/^[0-9a-fA-F]{24}$/)) {
    productDoc = await Product.findOne({ _id: productId, isActive: true })
      .populate({ path: "category", model: Category })
      .populate({ path: "brand", model: Brand })
      .populate({ path: "vendorId", model: User, select: "name storeName email" });
  }

  if (!productDoc) return null;

  let normalizedProduct = normalizeProduct(productDoc);
  normalizedProduct = await applyFlashSaleToSingleProduct(normalizedProduct);

  // Fetch reviews
  const reviewsDocs = await Review.find({ productId: productDoc._id, isApproved: true })
    .populate({ path: "userId", model: User, select: "name avatar" })
    .sort({ createdAt: -1 });

  // Calculate reviewNumber chronologically per user
  const userReviewCounts: Record<string, number> = {};
  const sortedChronologically = [...reviewsDocs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const reviewNumbers: Record<string, number> = {};
  sortedChronologically.forEach((r) => {
    const uId =
      r.userId && typeof r.userId === "object" && "_id" in r.userId
        ? (r.userId as any)._id.toString()
        : r.userId?.toString() || "anonymous";
    if (!userReviewCounts[uId]) {
      userReviewCounts[uId] = 0;
    }
    userReviewCounts[uId]++;
    reviewNumbers[r._id.toString()] = userReviewCounts[uId];
  });

  const mappedReviews = reviewsDocs.map((r: any) => ({
    id: r._id.toString(),
    productId: r.productId.toString(),
    userName:
      r.userId && typeof r.userId === "object" && "name" in r.userId
        ? (r.userId as any).name
        : "Anonymous",
    userId:
      r.userId && typeof r.userId === "object" && "_id" in r.userId
        ? (r.userId as any)._id.toString()
        : r.userId?.toString() || "",
    userAvatar:
      r.userId && typeof r.userId === "object" && "avatar" in r.userId
        ? (r.userId as any).avatar
        : undefined,
    rating: r.rating,
    title: r.title || "",
    body: r.comment || "",
    images: r.images || [],
    createdAt: new Date(r.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    verified: r.isVerifiedPurchase || false,
    reviewNumber: reviewNumbers[r._id.toString()] || 1,
    helpfulVotes: r.helpfulVotes || 0,
  }));

  // Fetch related products
  const relatedDocs = await Product.find({
    category: productDoc.category,
    _id: { $ne: productDoc._id },
    isActive: true,
  })
    .limit(4)
    .populate({ path: "category", model: Category });

  // JSON round-trip to guarantee all values are plain serializable objects
  // (strips any residual Mongoose/BSON types that slipped through normalizeProduct)
  return JSON.parse(
    JSON.stringify({
      product: normalizedProduct,
      reviews: mappedReviews,
      related: relatedDocs.map((p) => normalizeProduct(p)),
    }),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const { isReady } = await ensureDbReady();

  let product = null;
  if (isReady) {
    product = await Product.findOne({ slug: productId, isActive: true });
    if (!product && productId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findOne({ _id: productId, isActive: true });
    }
  }

  if (!product) {
    return {
      title: "Product Not Found — CosstechCom",
      description: "This footwear style is not available.",
    };
  }

  return {
    title: `${product.name} — CosstechCom`,
    description: product.description?.slice(0, 160) || `Buy ${product.name} at CosstechCom.`,
    alternates: {
      canonical: `/shop/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} — CosstechCom`,
      description: product.description?.slice(0, 160),
      images: [{ url: product.images?.[0]?.url || "/assets/product-placeholder.jpg" }],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { productId } = await params;
  const data = await getProductData(productId);

  if (!data) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold text-charcoal mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The style you are looking for does not exist or has been removed.
        </p>
        <Link href="/shop" className="underline font-semibold text-primary">
          Back to shop
        </Link>
      </div>
    );
  }

  // Schema.org JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.product.name,
    image: data.product.gallery,
    description: data.product.description,
    sku: data.product.id,
    brand: {
      "@type": "Brand",
      name: data.product.brand || "CosstechCom",
    },
    offers: {
      "@type": "Offer",
      url: `https://cosstechcom.maurya-tech.com/shop/${data.product.slug}`,
      priceCurrency: "INR",
      price: data.product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        data.product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      data.product.reviewsCount > 0
        ? {
            "@type": "AggregateRating",
            aggregateRating: data.product.rating,
            reviewCount: data.product.reviewsCount,
          }
        : undefined,
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
      {
        "@type": "ListItem",
        position: 3,
        name: data.product.category
          ? data.product.category.charAt(0).toUpperCase() + data.product.category.slice(1)
          : "Products",
        item: `https://cosstechcom.maurya-tech.com/shop?category=${data.product.category || "all"}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: data.product.name,
        item: `https://cosstechcom.maurya-tech.com/shop/${data.product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <ProductClient
        product={data.product}
        initialReviews={data.reviews}
        relatedProducts={data.related}
      />
    </>
  );
}

export async function generateStaticParams() {
  try {
    const { isReady } = await ensureDbReady();
    if (!isReady) return [];

    // Pre-generate static paths for the top 12 active products at build time
    const products = await Product.find({ isActive: true }).select("slug").limit(12).lean();
    return products.map((p: any) => ({
      productId: p.slug,
    }));
  } catch (err) {
    console.error("Failed to generate static params for products:", err);
    return [];
  }
}
