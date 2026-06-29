import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ensureDbReady, normalizeProduct } from "@/lib/db-utils";
import User from "@/lib/models/User";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Category";
import Brand from "@/lib/models/Brand";
import VendorProfile from "@/lib/models/VendorProfile";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { Store, Star, Package, ShieldCheck, ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getVendorData(slug: string) {
  const { isReady } = await ensureDbReady();
  if (!isReady) return null;

  const vendor = await User.findOne({
    storeSlug: slug,
    role: "vendor",
    vendorStatus: "approved",
    isActive: true,
  }).lean();

  if (!vendor) return null;

  const vendorProfile = await VendorProfile.findOne({ userId: vendor._id }).lean();

  const products = await Product.find({
    vendorId: vendor._id,
    isActive: true,
    approvalStatus: "approved",
  })
    .populate({ path: "category", model: Category })
    .populate({ path: "brand", model: Brand })
    .sort({ createdAt: -1 })
    .lean();

  const normalizedProducts = products.map((p: any) => normalizeProduct(p));

  return {
    vendor: {
      id: vendor._id.toString(),
      name: vendor.storeName || vendor.name,
      slug: vendor.storeSlug || slug,
      avatar: vendor.avatar || null,
      joinedAt: vendor.createdAt?.toISOString() || "",
    },
    profile: vendorProfile
      ? {
          description: (vendorProfile as any).businessDescription || "",
          city: (vendorProfile as any).city || "",
          state: (vendorProfile as any).state || "",
          rating: (vendorProfile as any).rating || 0,
          totalSales: (vendorProfile as any).totalSales || 0,
        }
      : null,
    products: normalizedProducts,
    totalProducts: normalizedProducts.length,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getVendorData(slug);

  if (!data) {
    return { title: "Seller Not Found | CosstechCom" };
  }

  return {
    title: `${data.vendor.name} — Verified Seller | CosstechCom`,
    description: `Shop products from ${data.vendor.name} on CosstechCom marketplace. ${data.totalProducts} products available.`,
    alternates: { canonical: `/store/${slug}` },
    openGraph: {
      title: `${data.vendor.name} — CosstechCom Seller`,
      description: `Explore ${data.totalProducts} products from ${data.vendor.name}.`,
    },
  };
}

export default async function VendorStorefrontPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getVendorData(slug);

  if (!data) {
    notFound();
  }

  const { vendor, profile, products, totalProducts } = data;

  const joinedYear = vendor.joinedAt
    ? new Date(vendor.joinedAt).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      {/* Vendor Header */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-charcoal mb-6 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Marketplace
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Vendor Avatar */}
            <div className="h-20 w-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
              {vendor.avatar ? (
                <img
                  src={vendor.avatar}
                  alt={vendor.name}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                <Store className="h-8 w-8 text-primary" />
              )}
            </div>

            {/* Vendor Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-charcoal">
                  {vendor.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider border border-success/20">
                  <ShieldCheck className="h-3 w-3" />
                  Verified Seller
                </span>
              </div>

              {profile?.description && (
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                  {profile.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
                {profile?.rating ? (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-cognac fill-cognac" />
                    <span className="font-bold text-charcoal">{profile.rating.toFixed(1)}</span>
                    Rating
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  <span className="font-bold text-charcoal">{totalProducts}</span>
                  Products
                </span>
                {profile?.city && (
                  <span>
                    📍 {profile.city}
                    {profile.state ? `, ${profile.state}` : ""}
                  </span>
                )}
                <span>Selling since {joinedYear}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-cognac font-semibold mb-1">
              All Products
            </p>
            <h2 className="font-serif text-xl md:text-2xl font-bold text-charcoal">
              {totalProducts} {totalProducts === 1 ? "Product" : "Products"} from {vendor.name}
            </h2>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border rounded-xl">
            <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              This seller hasn&apos;t listed any products yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p: any, i: number) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
