"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase as dbConnect } from "@/lib/db";
import Category from "@/lib/models/Category";
import Product from "@/lib/models/Product";
import Brand from "@/lib/models/Brand";
import Collection from "@/lib/models/Collection";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { logAdminActivity } from "@/lib/activity-logger";

async function checkAdminAuth() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    throw new Error("Unauthorized. Administrative privileges required.");
  }
  return session;
}

// --- CATEGORY ACTIONS ---

const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export async function createCategory(data: z.infer<typeof categorySchema>) {
  try {
    await checkAdminAuth();
    await dbConnect();
    const parsed = categorySchema.parse(data);
    await Category.create(parsed);
    await logAdminActivity({
      action: "CREATE_CATEGORY",
      details: `Created category "${parsed.name}"`,
    });
    revalidatePath("/admin/inventory/categories");
    revalidatePath("/shop");
    return { success: true };
  } catch (error: any) {
    console.error("Create Category Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCategory(id: string, data: z.infer<typeof categorySchema>) {
  try {
    await checkAdminAuth();
    await dbConnect();
    const parsed = categorySchema.parse(data);
    await Category.findByIdAndUpdate(id, parsed);
    await logAdminActivity({
      action: "UPDATE_CATEGORY",
      details: `Updated category "${parsed.name}" (ID: ${id})`,
    });
    revalidatePath("/admin/inventory/categories");
    revalidatePath("/shop");
    return { success: true };
  } catch (error: any) {
    console.error("Update Category Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(id: string) {
  try {
    await checkAdminAuth();
    await dbConnect();
    const productsCount = await Product.countDocuments({ category: id });
    if (productsCount > 0) {
      return {
        success: false,
        error: `Cannot delete category. ${productsCount} products are attached to it.`,
      };
    }
    await Category.findByIdAndDelete(id);
    await logAdminActivity({ action: "DELETE_CATEGORY", details: `Deleted category ID: ${id}` });
    revalidatePath("/admin/inventory/categories");
    revalidatePath("/shop");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- BRAND ACTIONS ---

const brandSchema = z.object({
  name: z.string().min(2, "Name is required"),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  order: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

export async function createBrand(data: z.infer<typeof brandSchema>) {
  try {
    await checkAdminAuth();
    await dbConnect();
    const parsed = brandSchema.parse(data);
    await Brand.create(parsed);
    await logAdminActivity({ action: "CREATE_BRAND", details: `Created brand "${parsed.name}"` });
    revalidatePath("/admin/inventory/brands");
    revalidatePath("/shop");
    return { success: true };
  } catch (error: any) {
    console.error("Create Brand Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBrand(id: string, data: z.infer<typeof brandSchema>) {
  try {
    await checkAdminAuth();
    await dbConnect();
    const parsed = brandSchema.parse(data);
    await Brand.findByIdAndUpdate(id, parsed);
    await logAdminActivity({
      action: "UPDATE_BRAND",
      details: `Updated brand "${parsed.name}" (ID: ${id})`,
    });
    revalidatePath("/admin/inventory/brands");
    revalidatePath("/shop");
    return { success: true };
  } catch (error: any) {
    console.error("Update Brand Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBrand(id: string) {
  try {
    await checkAdminAuth();
    await dbConnect();
    const productsCount = await Product.countDocuments({ brand: id });
    if (productsCount > 0) {
      return {
        success: false,
        error: `Cannot delete brand. ${productsCount} products are attached to it.`,
      };
    }
    await Brand.findByIdAndDelete(id);
    await logAdminActivity({ action: "DELETE_BRAND", details: `Deleted brand ID: ${id}` });
    revalidatePath("/admin/inventory/brands");
    revalidatePath("/shop");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- COLLECTION ACTIONS ---

const collectionSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  products: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export async function createCollection(data: z.infer<typeof collectionSchema>) {
  try {
    await checkAdminAuth();
    await dbConnect();
    const parsed = collectionSchema.parse(data);
    await Collection.create(parsed);
    await logAdminActivity({
      action: "CREATE_COLLECTION",
      details: `Created collection "${parsed.name}"`,
    });
    revalidatePath("/admin/inventory/collections");
    revalidatePath("/collections/" + parsed.slug);
    revalidatePath("/shop");
    return { success: true };
  } catch (error: any) {
    console.error("Create Collection Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCollection(id: string, data: z.infer<typeof collectionSchema>) {
  try {
    await checkAdminAuth();
    await dbConnect();
    const parsed = collectionSchema.parse(data);
    await Collection.findByIdAndUpdate(id, parsed);
    await logAdminActivity({
      action: "UPDATE_COLLECTION",
      details: `Updated collection "${parsed.name}" (ID: ${id})`,
    });
    revalidatePath("/admin/inventory/collections");
    revalidatePath("/collections/" + parsed.slug);
    revalidatePath("/shop");
    return { success: true };
  } catch (error: any) {
    console.error("Update Collection Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCollection(id: string) {
  try {
    await checkAdminAuth();
    await dbConnect();
    const coll = await Collection.findById(id);
    await Collection.findByIdAndDelete(id);
    await logAdminActivity({
      action: "DELETE_COLLECTION",
      details: `Deleted collection ID: ${id}`,
    });
    revalidatePath("/admin/inventory/collections");
    if (coll) {
      revalidatePath("/collections/" + coll.slug);
    }
    revalidatePath("/shop");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
// --- PRODUCT ACTIONS ---

const variantSchema = z.object({
  size: z.coerce.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  colorHex: z.string().min(1, "Color hex is required"),
  stock: z.coerce.number().min(0, "Stock cannot be negative"),
  sku: z.string().min(1, "SKU is required"),
  images: z.array(
    z.object({
      url: z.string().url("Must be a valid URL"),
      public_id: z.string(),
    }),
  ),
});

const productSchema = z.object({
  name: z.string().min(3, "Name is required"),
  slug: z.string().min(3, "Slug is required"),
  description: z.string().min(10, "Description is required"),
  brand: z.string().min(1, "Brand is required"),
  category: z.string().min(1, "Category is required"),
  gender: z.enum(["Men", "Women", "Children", "Unisex"]),
  occasion: z.array(z.string()).min(1, "At least one occasion is required"),
  images: z
    .array(
      z.object({
        url: z.string().url("Must be a valid URL"),
        public_id: z.string(),
      }),
    )
    .min(1, "At least one image is required"),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  salePrice: z.coerce.number().min(0, "Sale price must be positive"),
  returnDays: z.coerce.number().min(0, "Return days cannot be negative").default(7),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

export async function createProduct(data: z.infer<typeof productSchema>) {
  try {
    await checkAdminAuth();
    await dbConnect();
    const parsed = productSchema.parse(data);
    await Product.create(parsed);
    await logAdminActivity({
      action: "CREATE_PRODUCT",
      details: `Created product "${parsed.name}"`,
    });
    revalidatePath("/admin/inventory/products");
    revalidatePath("/shop");
    return { success: true };
  } catch (error: any) {
    console.error("Create Product Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProduct(id: string, data: z.infer<typeof productSchema>) {
  try {
    await checkAdminAuth();
    await dbConnect();
    const parsed = productSchema.parse(data);
    await Product.findByIdAndUpdate(id, parsed);
    await logAdminActivity({
      action: "UPDATE_PRODUCT",
      details: `Updated product "${parsed.name}" (ID: ${id})`,
    });
    revalidatePath("/admin/inventory/products");
    revalidatePath("/shop");
    return { success: true };
  } catch (error: any) {
    console.error("Update Product Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id: string) {
  try {
    await checkAdminAuth();
    await dbConnect();
    await Product.findByIdAndDelete(id);
    await logAdminActivity({ action: "DELETE_PRODUCT", details: `Deleted product ID: ${id}` });
    revalidatePath("/admin/inventory/products");
    revalidatePath("/shop");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
