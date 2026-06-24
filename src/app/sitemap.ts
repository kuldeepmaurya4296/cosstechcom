import { MetadataRoute } from "next";
import { ensureDbReady } from "@/lib/db-utils";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Category";
import Collection from "@/lib/models/Collection";
import { docsSections } from "@/data/docs-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const { isReady } = await ensureDbReady();
    const baseUrl = "https://cosstechcom.com";

    const staticRoutes = [
      { url: baseUrl, lastModified: new Date() },
      { url: `${baseUrl}/shop`, lastModified: new Date() },
      { url: `${baseUrl}/docs`, lastModified: new Date() },
      { url: `${baseUrl}/privacy-policy`, lastModified: new Date() },
      { url: `${baseUrl}/terms`, lastModified: new Date() },
      { url: `${baseUrl}/delivery-policy`, lastModified: new Date() },
      { url: `${baseUrl}/refund-policy`, lastModified: new Date() },
    ];

    if (!isReady) {
      console.warn("Database connection is not ready. Returning static routes in sitemap.");
      return staticRoutes;
    }

    const [products, categories, collections] = await Promise.all([
      Product.find({ isActive: true }).select("slug updatedAt").lean(),
      Category.find().select("slug").lean(),
      Collection.find({ isActive: true }).select("slug updatedAt").lean(),
    ]);

    const categoryRoutes = categories.map((c: any) => ({
      url: `${baseUrl}/shop?category=${c.slug}`,
      lastModified: new Date(),
    }));

    const productRoutes = products.map((p: any) => ({
      url: `${baseUrl}/shop/${p.slug}`,
      lastModified: p.updatedAt || new Date(),
    }));

    const collectionRoutes = collections.map((col: any) => ({
      url: `${baseUrl}/collections/${col.slug}`,
      lastModified: col.updatedAt || new Date(),
    }));

    const docRoutes = docsSections.map((s) => ({
      url: `${baseUrl}/docs/${s.id}`,
      lastModified: new Date(),
    }));

    return [
      ...staticRoutes,
      ...categoryRoutes,
      ...productRoutes,
      ...collectionRoutes,
      ...docRoutes,
    ];
  } catch (err) {
    console.error("Failed to generate sitemap:", err);
    return [
      { url: "https://cosstechcom.com", lastModified: new Date() },
      { url: "https://cosstechcom.com/shop", lastModified: new Date() },
    ];
  }
}
