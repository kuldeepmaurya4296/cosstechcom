import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually load env variables from .env BEFORE any other imports to prevent empty load bindings
try {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    });
  }
} catch (e) {
  console.warn("Failed to load .env manually:", e);
}

// Now dynamically import database connection and models after env is set
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const { connectToDatabase } = await import("../src/lib/db");
const User = (await import("../src/lib/models/User")).default;
const Product = (await import("../src/lib/models/Product")).default;
const Category = (await import("../src/lib/models/Category")).default;
const Brand = (await import("../src/lib/models/Brand")).default;
const Settings = (await import("../src/lib/models/Settings")).default;
const Banner = (await import("../src/lib/models/Banner")).default;
const Coupon = (await import("../src/lib/models/Coupon")).default;
const VendorProfile = (await import("../src/lib/models/VendorProfile")).default;
const Counter = (await import("../src/lib/models/Counter")).default;
const FlashSale = (await import("../src/lib/models/FlashSale")).default;

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in the environment. Exiting seed script.");
  process.exit(1);
}

// Color Name to Hex Map helper
const COLOR_HEXES: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#10B981",
  yellow: "#FBBF24",
  grey: "#6B7280",
  gray: "#6B7280",
  brown: "#78350F",
  tan: "#D2B48C",
  navy: "#1E3A8A",
  pink: "#EC4899",
  orange: "#F97316",
  gold: "#D97706",
  silver: "#E5E7EB",
  cream: "#FFFDD0",
  beige: "#F5F5DC",
  purple: "#8B5CF6",
};

async function seed() {
  try {
    console.log("Connecting to the database...");
    const conn = await connectToDatabase();
    if (!conn) {
      throw new Error("Failed to connect to MongoDB.");
    }
    console.log("Connected successfully. Cleaning up collections...");

    // Delete existing records to perform a clean seed (preserves index definitions)
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    await Settings.deleteMany({});
    await Banner.deleteMany({});
    await Coupon.deleteMany({});
    await VendorProfile.deleteMany({});
    await Counter.deleteMany({});
    await FlashSale.deleteMany({});

    console.log("Cleanup complete. Seeding settings...");

    // 1. Seed Store Settings
    await Settings.create({
      key: "general",
      value: {
        storeName: "CosstechCom",
        supportEmail: "care@cosstechcom.com",
        taxRate: 18, // GST default
        shippingFee: 40,
        freeShippingThreshold: 500,
      },
    });

    // 2. Seed Counter
    await Counter.create({
      _id: "orderId",
      seq: 0,
    });

    console.log("Seeding multi-role users...");

    // 3. Seed Users & Passwords
    const commonPasswordHash = bcrypt.hashSync("Vendor@2026", 10);
    const adminPasswordHash = bcrypt.hashSync("Admin@Cosstech2026", 10);
    const customerPasswordHash = bcrypt.hashSync("Customer@2026", 10);
    const deliveryPasswordHash = bcrypt.hashSync("Delivery@2026", 10);
    const supportPasswordHash = bcrypt.hashSync("Support@2026", 10);

    // Create Admin
    const admin = await User.create({
      name: "Cosstech Admin",
      email: "admin@cosstechcom.com",
      password: adminPasswordHash,
      role: "admin",
      isActive: true,
      isEmailVerified: true,
    });

    // Create Vendors
    const vendorData = [
      { name: "Apex Electronics", email: "vendor.electronics@cosstechcom.com", store: "Apex Electronics", slug: "apex-electronics" },
      { name: "Vogue Clothing", email: "vendor.fashion@cosstechcom.com", store: "Vogue Fashion", slug: "vogue-fashion" },
      { name: "FreshCart Grocery", email: "vendor.grocery@cosstechcom.com", store: "FreshCart Grocery", slug: "freshcart-grocery" },
      { name: "DecoWood Furniture", email: "vendor.home@cosstechcom.com", store: "DecoWood Home", slug: "decowood-home" },
      { name: "ActiveSports Co", email: "vendor.sports@cosstechcom.com", store: "ActiveSports Co", slug: "activesports-co" },
    ];

    const vendors: any[] = [];
    for (const v of vendorData) {
      const vendorUser = await User.create({
        name: v.name,
        email: v.email,
        password: commonPasswordHash,
        role: "vendor",
        vendorStatus: "approved",
        storeName: v.store,
        storeSlug: v.slug,
        isActive: true,
        isEmailVerified: true,
      });

      // Create profile details
      await VendorProfile.create({
        userId: vendorUser._id,
        storeName: v.store,
        storeSlug: v.slug,
        storeDescription: `Premium multi-category vendor: ${v.store}`,
        businessAddress: "101 Business Enclave, Tech Park, Jaipur, Rajasthan",
        gstNumber: `08AAAAA${Math.floor(1000 + Math.random() * 9000)}A1Z${Math.floor(Math.random() * 9)}`,
        panNumber: `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`,
        bankAccount: {
          holderName: v.name,
          bankName: "HDFC Bank",
          accountNumber: `5010020${Math.floor(100000 + Math.random() * 900000)}`,
          ifscCode: "HDFC0000123",
        },
        commissionRate: 10,
        verificationStatus: "approved",
        approvedBy: admin._id,
        approvedAt: new Date(),
      });

      vendors.push(vendorUser);
    }

    // Create 1 Pending Vendor
    const pendingVendor = await User.create({
      name: "Neo Traders",
      email: "vendor.pending@cosstechcom.com",
      password: commonPasswordHash,
      role: "vendor",
      vendorStatus: "pending",
      storeName: "Neo Traders",
      storeSlug: "neo-traders",
      isActive: true,
      isEmailVerified: true,
    });

    await VendorProfile.create({
      userId: pendingVendor._id,
      storeName: "Neo Traders",
      storeSlug: "neo-traders",
      storeDescription: "Onboarding local merchant with wholesale stock.",
      businessAddress: "402 Market Lane, New Delhi",
      gstNumber: "07BBBBB1234A1Z2",
      panNumber: "FGHIJ5678K",
      bankAccount: {
        holderName: "Neo Traders",
        bankName: "State Bank of India",
        accountNumber: "30512345678",
        ifscCode: "SBIN0001234",
      },
      commissionRate: 12,
      verificationStatus: "pending",
    });

    // Create Customers
    const customer1 = await User.create({
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      password: customerPasswordHash,
      role: "customer",
      walletBalance: 250,
      isActive: true,
      isEmailVerified: true,
      addresses: [
        {
          label: "Home",
          fullName: "Rahul Sharma",
          phone: "9876543210",
          line1: "A-402 Shanti Kunj, Sector 15",
          line2: "Near Metro Station",
          city: "Noida",
          state: "Uttar Pradesh",
          pin: "201301",
          isDefault: true,
        },
      ],
    });

    const customer2 = await User.create({
      name: "Priya Patel",
      email: "priya.patel@example.com",
      password: customerPasswordHash,
      role: "customer",
      walletBalance: 0,
      isActive: true,
      isEmailVerified: true,
      addresses: [
        {
          label: "Work",
          fullName: "Priya Patel",
          phone: "9123456789",
          line1: "BGC Towers, 5th Floor, Ring Road",
          city: "Bengaluru",
          state: "Karnataka",
          pin: "560001",
          isDefault: true,
        },
      ],
    });

    const customer3 = await User.create({
      name: "Amit Verma",
      email: "amit.verma@example.com",
      password: customerPasswordHash,
      role: "customer",
      walletBalance: 100,
      isActive: true,
      isEmailVerified: true,
    });

    // Create Delivery Partners
    const delivery1 = await User.create({
      name: "Rajesh Express",
      email: "delivery.partner1@cosstechcom.com",
      password: deliveryPasswordHash,
      role: "delivery_partner",
      isActive: true,
      isEmailVerified: true,
    });

    const delivery2 = await User.create({
      name: "Vikram Cargo",
      email: "delivery.partner2@cosstechcom.com",
      password: deliveryPasswordHash,
      role: "delivery_partner",
      isActive: true,
      isEmailVerified: true,
    });

    // Create Support Agent
    const support = await User.create({
      name: "Sonia Care",
      email: "support.agent1@cosstechcom.com",
      password: supportPasswordHash,
      role: "support",
      isActive: true,
      isEmailVerified: true,
    });

    console.log("Seeding 3-level categories...");

    // 4. Seed Categories (10 Departments -> Sub-categories)
    const departmentsData = [
      {
        name: "Electronics",
        slug: "electronics",
        icon: "Cpu",
        imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800&auto=format&fit=crop",
        bannerImageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1200&auto=format&fit=crop",
        subs: [
          { name: "Mobiles", slug: "mobiles", subSubs: ["Smartphones", "Feature Phones"] },
          { name: "Laptops", slug: "laptops", subSubs: ["Gaming Laptops", "Business Laptops"] },
          { name: "Audio", slug: "audio", subSubs: ["Earbuds", "Headphones"] },
        ],
      },
      {
        name: "Fashion",
        slug: "fashion",
        icon: "Shirt",
        imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
        bannerImageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop",
        subs: [
          { name: "Men's Wear", slug: "mens-wear", subSubs: ["T-Shirts", "Shirts", "Sneakers"] },
          { name: "Women's Wear", slug: "womens-wear", subSubs: ["Sarees", "Kurtas", "Heels"] },
        ],
      },
      {
        name: "Grocery",
        slug: "grocery",
        icon: "ShoppingBag",
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop",
        bannerImageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
        subs: [
          { name: "Staples", slug: "staples", subSubs: ["Rice & Flour", "Spices & Oils"] },
          { name: "Beverages", slug: "beverages", subSubs: ["Tea", "Coffee"] },
        ],
      },
      {
        name: "Home & Furniture",
        slug: "home-furniture",
        icon: "Home",
        imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop",
        bannerImageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop",
        subs: [
          { name: "Furniture", slug: "furniture", subSubs: ["Sofas", "Dining Tables"] },
          { name: "Kitchen", slug: "kitchen", subSubs: ["Cookware", "Juicers"] },
        ],
      },
      {
        name: "Sports & Fitness",
        slug: "sports-fitness",
        icon: "Activity",
        imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop",
        bannerImageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop",
        subs: [
          { name: "Gym Equipment", slug: "gym-equipment", subSubs: ["Dumbbells", "Yoga Mats"] },
          { name: "Sports Gear", slug: "sports-gear", subSubs: ["Cricket Bats", "Football"] },
        ],
      },
    ];

    const categoryMap = new Map<string, mongoose.Types.ObjectId>();

    for (const dept of departmentsData) {
      // Level 1: Department
      const level1Doc = await Category.create({
        name: dept.name,
        slug: dept.slug,
        level: 1,
        icon: dept.icon,
        imageUrl: dept.imageUrl,
        bannerImageUrl: dept.bannerImageUrl,
        commissionRate: 10,
        parentId: null,
      });
      categoryMap.set(dept.slug, level1Doc._id);

      for (const sub of dept.subs) {
        // Level 2: Sub-category
        const level2Doc = await Category.create({
          name: sub.name,
          slug: `${dept.slug}-${sub.slug}`,
          level: 2,
          parentId: level1Doc._id,
          commissionRate: 10,
        });
        categoryMap.set(`${dept.slug}-${sub.slug}`, level2Doc._id);

        for (const subSubName of sub.subSubs) {
          const subSubSlug = subSubName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          // Level 3: Leaf-category
          const level3Doc = await Category.create({
            name: subSubName,
            slug: `${dept.slug}-${sub.slug}-${subSubSlug}`,
            level: 3,
            parentId: level2Doc._id,
            commissionRate: 10,
          });
          categoryMap.set(`${dept.slug}-${sub.slug}-${subSubSlug}`, level3Doc._id);
        }
      }
    }

    console.log("Seeding brands...");

    // 5. Seed Brands
    const brandData = [
      { name: "Samsung", order: 1 },
      { name: "HP", order: 2 },
      { name: "JBL", order: 3 },
      { name: "Nike", order: 4 },
      { name: "Sabyasachi", order: 5 },
      { name: "Patanjali", order: 6 },
      { name: "Tata Tea", order: 7 },
      { name: "Godrej", order: 8 },
      { name: "Prestige", order: 9 },
      { name: "Decathlon", order: 10 },
      { name: "Generic Brand", order: 99 },
    ];

    const brandMap = new Map<string, mongoose.Types.ObjectId>();
    for (const b of brandData) {
      const brandDoc = await Brand.create({
        name: b.name,
        order: b.order,
        isActive: true,
      });
      brandMap.set(b.name, brandDoc._id);
    }

    console.log("Seeding products...");

    // 6. Seed Products (Realistic listings mapped to appropriate vendors)
    const productTemplates = [
      // Electronics (Samsung/HP/JBL -> Vendor 1 (Apex Electronics))
      {
        name: "Samsung Galaxy S24 Ultra",
        description: "Flagship smartphone with AI camera, Snapdragon 8 Gen 3, and Titanium frame.",
        price: 139999,
        salePrice: 129999,
        categorySlug: "electronics-mobiles-smartphones",
        brandName: "Samsung",
        vendorIndex: 0,
        gender: "None",
        imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "256GB", color: "Titanium Gray", colorHex: COLOR_HEXES.gray, stock: 15, sku: "SAM-S24U-256G-GR" },
          { size: "512GB", color: "Titanium Black", colorHex: COLOR_HEXES.black, stock: 10, sku: "SAM-S24U-512G-BL" },
        ],
        specifications: [
          { key: "Processor", value: "Snapdragon 8 Gen 3" },
          { key: "RAM", value: "12GB" },
          { key: "Rear Camera", value: "200MP + 50MP + 12MP + 10MP" },
          { key: "Battery", value: "5000 mAh" },
        ],
        tags: ["mobile", "samsung", "smartphone", "flagship"],
      },
      {
        name: "HP Pavilion 15 Laptop",
        description: "High-performance laptop featuring AMD Ryzen 5, 16GB RAM, and 512GB SSD.",
        price: 64999,
        salePrice: 58999,
        categorySlug: "electronics-laptops-business-laptops",
        brandName: "HP",
        vendorIndex: 0,
        gender: "None",
        imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "15.6 Inch", color: "Natural Silver", colorHex: COLOR_HEXES.silver, stock: 8, sku: "HP-PAV15-SL" },
        ],
        specifications: [
          { key: "CPU", value: "AMD Ryzen 5 5600U" },
          { key: "RAM", value: "16GB DDR4" },
          { key: "Storage", value: "512GB NVMe SSD" },
          { key: "OS", value: "Windows 11 Home" },
        ],
        tags: ["hp", "laptop", "office", "student"],
      },
      {
        name: "JBL Wave Flex Earbuds",
        description: "True wireless earbuds with deep bass sound, 32-hour battery, and water-resistance.",
        price: 4999,
        salePrice: 3499,
        categorySlug: "electronics-audio-earbuds",
        brandName: "JBL",
        vendorIndex: 0,
        gender: "None",
        imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "Regular", color: "Black", colorHex: COLOR_HEXES.black, stock: 25, sku: "JBL-WFLEX-BL" },
          { size: "Regular", color: "White", colorHex: COLOR_HEXES.white, stock: 20, sku: "JBL-WFLEX-WH" },
        ],
        specifications: [
          { key: "Driver Size", value: "12 mm" },
          { key: "Playtime", value: "8 Hrs (Earbuds) + 24 Hrs (Case)" },
          { key: "Bluetooth", value: "v5.2" },
        ],
        tags: ["audio", "earbuds", "jbl", "wireless"],
      },
      // Fashion (Nike/Sabyasachi -> Vendor 2 (Vogue Fashion))
      {
        name: "Nike Air Max Sneakers",
        description: "Premium casual and running sneakers with air-bubble sole cushioning.",
        price: 8999,
        salePrice: 7999,
        categorySlug: "fashion-mens-wear-sneakers",
        brandName: "Nike",
        vendorIndex: 1,
        gender: "Men",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "8", color: "Black-White", colorHex: COLOR_HEXES.black, stock: 12, sku: "NKE-AMAX-8-BL" },
          { size: "9", color: "Black-White", colorHex: COLOR_HEXES.black, stock: 15, sku: "NKE-AMAX-9-BL" },
          { size: "10", color: "Navy Blue", colorHex: COLOR_HEXES.navy, stock: 8, sku: "NKE-AMAX-10-NV" },
        ],
        specifications: [
          { key: "Sole", value: "Rubber Air Sole" },
          { key: "Material", value: "Mesh & Synthetic Leather" },
          { key: "Occasion", value: "Sports & Casual" },
        ],
        tags: ["nike", "sneakers", "running", "shoes"],
      },
      {
        name: "Sabyasachi Designer Banarasi Saree",
        description: "Exquisite hand-woven Banarasi silk saree featuring fine gold zari floral details.",
        price: 45000,
        salePrice: 38000,
        categorySlug: "fashion-womens-wear-sarees",
        brandName: "Sabyasachi",
        vendorIndex: 1,
        gender: "Women",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "Free Size", color: "Crimson Red", colorHex: COLOR_HEXES.red, stock: 5, sku: "SAB-SRE-RED" },
        ],
        specifications: [
          { key: "Fabric", value: "Pure Katan Silk" },
          { key: "Zari Type", value: "Gold Zari" },
          { key: "Craft", value: "Handloom Weaving" },
        ],
        tags: ["saree", "silk", "designer", "wedding", "bridal"],
      },
      // Grocery (Tata Tea/Patanjali -> Vendor 3 (FreshCart Grocery))
      {
        name: "Tata Tea Gold 1kg",
        description: "Premium blend of Assam CTC teas with gentle long leaves for flavor and aroma.",
        price: 420,
        salePrice: 399,
        categorySlug: "grocery-beverages-tea",
        brandName: "Tata Tea",
        vendorIndex: 2,
        gender: "None",
        imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "1 kg", color: "Red Label", colorHex: COLOR_HEXES.red, stock: 100, sku: "TATA-TG-1K" },
        ],
        specifications: [
          { key: "Weight", value: "1 kg" },
          { key: "Form", value: "Tea Leaves" },
        ],
        tags: ["tea", "tata", "beverage", "grocery"],
      },
      {
        name: "Patanjali Basmati Rice Premium",
        description: "Long grain aromatic Basmati rice, aged perfectly for rich taste.",
        price: 150,
        salePrice: 135,
        categorySlug: "grocery-staples-rice-flour",
        brandName: "Patanjali",
        vendorIndex: 2,
        gender: "None",
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "5 kg", color: "White Rice", colorHex: COLOR_HEXES.white, stock: 50, sku: "PAT-BAS-5K" },
        ],
        specifications: [
          { key: "Weight", value: "5 kg" },
          { key: "Grain Type", value: "Basmati Long Grain" },
        ],
        tags: ["rice", "grocery", "staples", "patanjali"],
      },
      // Home & Furniture (Godrej/Prestige -> Vendor 4 (DecoWood Home))
      {
        name: "DecoWood 3-Seater Fabric Sofa",
        description: "Modern, comfortable fabric sofa with solid wood framing and premium foam cushioning.",
        price: 29999,
        salePrice: 24999,
        categorySlug: "home-furniture-furniture-sofas",
        brandName: "Godrej",
        vendorIndex: 3,
        gender: "None",
        imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "3 Seater", color: "Cocoa Brown", colorHex: COLOR_HEXES.brown, stock: 5, sku: "DWD-SOFA-3S-BR" },
        ],
        specifications: [
          { key: "Frame Material", value: "Solid Sal Wood" },
          { key: "Fabric Type", value: "Premium Linen Blend" },
          { key: "Dimensions", value: "78 x 32 x 34 Inches" },
        ],
        tags: ["sofa", "furniture", "living-room", "home"],
      },
      {
        name: "Prestige Omega Non-Stick Pan",
        description: "Durable non-stick tawa pan with 3-layer granite coating and induction base.",
        price: 1450,
        salePrice: 1200,
        categorySlug: "home-furniture-kitchen-cookware",
        brandName: "Prestige",
        vendorIndex: 3,
        gender: "None",
        imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "28 cm", color: "Granite Black", colorHex: COLOR_HEXES.black, stock: 30, sku: "PRS-PAN-28" },
        ],
        specifications: [
          { key: "Diameter", value: "28 cm" },
          { key: "Coating", value: "3-Layer Granite Coating" },
          { key: "Induction Base", value: "Yes" },
        ],
        tags: ["pan", "cookware", "kitchen", "prestige"],
      },
      // Sports & Fitness (Decathlon -> Vendor 5 (ActiveSports Co))
      {
        name: "Decathlon Hex Dumbbells Pair",
        description: "Rubber coated hex-shaped dumbbells for weight training and fitness.",
        price: 3200,
        salePrice: 2800,
        categorySlug: "sports-fitness-gym-equipment-dumbbells",
        brandName: "Decathlon",
        vendorIndex: 4,
        gender: "None",
        imageUrl: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "5kg Pair", color: "Black", colorHex: COLOR_HEXES.black, stock: 15, sku: "DEC-HEX-5K" },
          { size: "10kg Pair", color: "Black", colorHex: COLOR_HEXES.black, stock: 10, sku: "DEC-HEX-10K" },
        ],
        specifications: [
          { key: "Weight", value: "5kg / 10kg Pair" },
          { key: "Shape", value: "Hexagonal" },
          { key: "Grip", value: "Knurled Steel" },
        ],
        tags: ["dumbbells", "gym", "decathlon", "fitness"],
      },
    ];

    for (const t of productTemplates) {
      const categoryId = categoryMap.get(t.categorySlug);
      const brandId = brandMap.get(t.brandName) || brandMap.get("Generic Brand");
      const vendorUser = vendors[t.vendorIndex];

      if (!categoryId || !brandId || !vendorUser) {
        console.warn(`Skipping seeding for template: ${t.name}. Category or Brand or Vendor not resolved.`);
        continue;
      }

      const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const enrichedVariants = t.variants.map((v) => ({
        ...v,
        images: [
          {
            url: t.imageUrl,
            public_id: `product-placeholder-${slug}`,
          },
        ],
      }));

      await Product.create({
        name: t.name,
        slug,
        description: t.description,
        brand: brandId,
        vendorId: vendorUser._id,
        category: categoryId,
        gender: t.gender,
        images: [
          {
            url: t.imageUrl,
            public_id: `product-placeholder-${slug}`,
          },
        ],
        variants: enrichedVariants,
        price: t.price,
        salePrice: t.salePrice,
        returnDays: 7,
        rating: { average: 4.5, count: 2 },
        isFeatured: Math.random() > 0.5,
        isNewArrival: true,
        isActive: true,
        approvalStatus: "approved",
        specifications: t.specifications,
        freeShipping: t.salePrice > 1000,
        estimatedDeliveryDays: 4,
        tags: t.tags,
        metaTitle: `${t.name} - Buy Online | CosstechCom`,
        metaDescription: t.description.substring(0, 150),
      });
    }

    console.log("Seeding banners...");

    // 7. Seed Banners (Marketplace style)
    await Banner.create([
      {
        title: "Big Electronics Sale",
        subtitle: "Up to 40% Off on Top Smartphones & Laptops",
        imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80",
        linkUrl: "/shop?category=electronics",
        order: 1,
        isActive: true,
      },
      {
        title: "Designer Sarees & Ethnic Styles",
        subtitle: "Luxury collections for the festive season",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
        linkUrl: "/shop?category=fashion-womens-wear-sarees",
        order: 2,
        isActive: true,
      },
      {
        title: "Groceries Delivered in Hours",
        subtitle: "Flat 10% instant cashback on staples & tea",
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
        linkUrl: "/shop?category=grocery",
        order: 3,
        isActive: true,
      },
    ]);

    console.log("Seeding coupons...");

    // 8. Seed Coupons
    await Coupon.create([
      {
        code: "WELCOME50",
        type: "Flat",
        value: 50,
        minCartValue: 200,
        scope: "platform",
        isActive: true,
        validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        code: "COSS10",
        type: "Percentage",
        value: 10,
        minCartValue: 1000,
        maxDiscount: 500,
        scope: "platform",
        isActive: true,
        validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        code: "ELECTRO5",
        type: "Percentage",
        value: 5,
        minCartValue: 5000,
        maxDiscount: 1000,
        scope: "category",
        categoryIds: [categoryMap.get("electronics")],
        isActive: true,
        validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log("Seeding flash sales...");

    // Get 4 random products
    const flashProducts = await Product.find({ isActive: true }).limit(4);
    if (flashProducts.length > 0) {
      await FlashSale.create({
        name: "Mega Flash Sale",
        discountType: "PERCENTAGE",
        discountValue: 20, // 20% off
        products: flashProducts.map((p) => p._id),
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // started 2 hours ago
        endTime: new Date(Date.now() + 10 * 60 * 60 * 1000), // ends in 10 hours
        isActive: true,
      });
    }

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed with error:", error);
    process.exit(1);
  }
}

seed();
