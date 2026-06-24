import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/lib/models/Product";
import Brand from "@/lib/models/Brand";
import Category from "@/lib/models/Category";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";

const COLOR_MAP: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#10B981",
  yellow: "#FBBF24",
  orange: "#F97316",
  purple: "#8B5CF6",
  pink: "#EC4899",
  grey: "#6B7280",
  gray: "#6B7280",
  brown: "#78350F",
  navy: "#1E3A8A",
  tan: "#D2B48C",
  beige: "#F5F5DC",
  oxblood: "#4A0E17",
  cognac: "#9A3412",
  burgundy: "#800020",
  maroon: "#800000",
  gold: "#D4AF37",
  silver: "#C0C0C0",
};

function getColorHex(colorName: string): string {
  const normalized = colorName.trim().toLowerCase();
  return COLOR_MAP[normalized] || "#CCCCCC";
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    if (lines.length < 2) {
      return NextResponse.json({ error: "Empty CSV file" }, { status: 400 });
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

    // Basic headers validation
    const requiredHeaders = ["name", "size", "color", "stock", "price"];
    const missing = requiredHeaders.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required CSV headers: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const productsMap = new Map<string, any>();

    for (let i = 1; i < lines.length; i++) {
      const rowData = parseCSVLine(lines[i]);
      if (rowData.length < headers.length) continue;

      const getVal = (name: string) => {
        const idx = headers.indexOf(name);
        return idx !== -1 ? rowData[idx] : "";
      };

      const name = getVal("name");
      if (!name) continue;

      if (!productsMap.has(name)) {
        productsMap.set(name, {
          name,
          description: getVal("description") || name,
          brand: getVal("brand") || "Generic",
          category: getVal("category") || "Shoes",
          vendorEmail: getVal("vendoremail") || getVal("vendor") || "",
          gender: getVal("gender") || "Unisex",
          price: Number(getVal("price") || 0),
          salePrice: Number(getVal("saleprice") || getVal("price") || 0),
          images: getVal("images") ? getVal("images").split(";").map((img) => img.trim()).filter(Boolean) : [],
          rows: [],
        });
      }

      productsMap.get(name).rows.push({
        size: getVal("size"),
        color: getVal("color"),
        stock: Number(getVal("stock") || 0),
        sku: getVal("sku") || `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${getVal("color").toLowerCase()}-${getVal("size")}`,
        images: getVal("variantimages") ? getVal("variantimages").split(";").map((img) => img.trim()).filter(Boolean) : [],
      });
    }

    let importedCount = 0;

    for (const [name, pData] of productsMap.entries()) {
      // 1. Resolve Brand
      let brandDoc = await Brand.findOne({ name: { $regex: new RegExp(`^${pData.brand.trim()}$`, "i") } });
      if (!brandDoc) {
        brandDoc = await Brand.create({ name: pData.brand.trim() });
      }

      // 2. Resolve Category
      let categoryDoc = await Category.findOne({ name: { $regex: new RegExp(`^${pData.category.trim()}$`, "i") } });
      if (!categoryDoc) {
        const slug = pData.category.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        categoryDoc = await Category.create({ name: pData.category.trim(), slug });
      }

      // 3. Resolve Vendor
      let vendorDoc = null;
      if (pData.vendorEmail) {
        vendorDoc = await User.findOne({ email: pData.vendorEmail.trim().toLowerCase(), role: "vendor" });
      }
      if (!vendorDoc) {
        vendorDoc = await User.findOne({ role: "vendor" });
      }
      if (!vendorDoc) {
        vendorDoc = await User.findById(session.user.id);
      }

      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const mainImages = pData.images.map((url: string) => ({
        url,
        public_id: `imported_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      }));

      const variants = pData.rows.map((row: any) => {
        const colorHex = getColorHex(row.color);
        const varImages = row.images.length > 0
          ? row.images.map((url: string) => ({
              url,
              public_id: `imported_var_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            }))
          : mainImages;

        return {
          size: row.size,
          color: row.color,
          colorHex,
          stock: row.stock,
          sku: row.sku,
          images: varImages,
        };
      });

      let productDoc = await Product.findOne({ slug });
      if (productDoc) {
        productDoc.name = name;
        productDoc.description = pData.description;
        productDoc.brand = brandDoc._id;
        productDoc.category = categoryDoc._id;
        productDoc.vendorId = vendorDoc._id;
        productDoc.gender = pData.gender;
        productDoc.price = pData.price;
        productDoc.salePrice = pData.salePrice;
        if (mainImages.length > 0) {
          productDoc.images = mainImages;
        }
        productDoc.variants = variants;
        await productDoc.save();
      } else {
        await Product.create({
          name,
          slug,
          description: pData.description,
          brand: brandDoc._id,
          category: categoryDoc._id,
          vendorId: vendorDoc._id,
          gender: pData.gender,
          price: pData.price,
          salePrice: pData.salePrice,
          images: mainImages.length > 0 ? mainImages : [{ url: "/assets/product-placeholder.jpg", public_id: "placeholder" }],
          variants,
          approvalStatus: "approved",
          isActive: true,
        });
      }
      importedCount++;
    }

    return NextResponse.json({ success: true, count: importedCount });
  } catch (error: any) {
    console.error("Failed to import products:", error);
    return NextResponse.json({ error: error.message || "Failed to import products" }, { status: 500 });
  }
}
