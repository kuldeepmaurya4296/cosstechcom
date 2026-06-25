import React from "react";
import { Metadata } from "next";
import Collection from "@/lib/models/Collection";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Category";
import Brand from "@/lib/models/Brand";
import { ensureDbReady, normalizeProduct } from "@/lib/db-utils";
import { ProductCard } from "@/modules/products/components/ProductCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCollectionData(slug: string) {
  const { isReady } = await ensureDbReady();
  if (!isReady) return null;

  const collectionDoc = await Collection.findOne({ slug, isActive: true }).lean();
  if (!collectionDoc) return null;

  // Fetch products inside this collection
  const productsDocs = await Product.find({
    _id: { $in: collectionDoc.products },
    isActive: true,
  })
    .populate({ path: "category", model: Category })
    .populate({ path: "brand", model: Brand })
    .lean();

  const products = productsDocs.map((p) => normalizeProduct(p));

  return {
    collection: {
      name: collectionDoc.name,
      slug: collectionDoc.slug,
      description: collectionDoc.description || "",
      imageUrl: collectionDoc.imageUrl || "/assets/hero-boots.jpg",
    },
    products,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { isReady } = await ensureDbReady();

  let collection = null;
  if (isReady) {
    collection = await Collection.findOne({ slug, isActive: true });
  }

  if (!collection) {
    return {
      title: "Collection Not Found — CosstechCom",
    };
  }

  return {
    title: `${collection.name} — CosstechCom`,
    description:
      collection.description ||
      `Browse the exclusive ${collection.name} collection at CosstechCom.`,
    alternates: {
      canonical: `/collections/${slug}`,
    },
    openGraph: {
      title: `${collection.name} — CosstechCom`,
      description:
        collection.description ||
        `Browse the exclusive ${collection.name} collection at CosstechCom.`,
      images: [{ url: collection.imageUrl || "/assets/hero-boots.jpg" }],
    },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getCollectionData(slug);

  if (!data) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold text-charcoal mb-4">Collection Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The collection you are looking for does not exist or has been removed.
        </p>
        <Link href="/shop" className="underline font-semibold text-primary">
          Go to shop catalog
        </Link>
      </div>
    );
  }

  const { collection, products } = data;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description:
      collection.description ||
      `Browse the exclusive ${collection.name} collection at CosstechCom.`,
    url: `https://cosstechcom.maurya-tech.com/collections/${collection.slug}`,
    image: collection.imageUrl || "/assets/hero-boots.jpg",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 12).map((product: any, idx: number) => ({
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
      {
        "@type": "ListItem",
        position: 3,
        name: collection.name,
        item: `https://cosstechcom.maurya-tech.com/collections/${collection.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-cream/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      {/* Editorial Header Banner */}
      <div className="relative h-[250px] md:h-[350px] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-charcoal/40 z-10" />
        <img
          src={collection.imageUrl}
          alt={collection.name}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Dynamic decorative texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/30 z-10" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center text-white z-20 max-w-3xl space-y-3">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] font-semibold text-brass">
            Exclusive Collection
          </p>
          <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-md">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-xs md:text-sm text-white/95 max-w-xl mx-auto font-sans leading-relaxed drop-shadow">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Navigation back */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to all styles
          </Link>
          <p className="text-xs text-muted-foreground font-semibold">
            {products.length} {products.length === 1 ? "Style" : "Styles"}
          </p>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-card">
            <p className="text-base text-muted-foreground">
              No products are currently in this collection.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-primary/95 transition-colors"
            >
              Explore Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
