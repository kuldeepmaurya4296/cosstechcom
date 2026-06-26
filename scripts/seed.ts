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

// New models for Phase 1.6
const Wallet = (await import("../src/lib/models/Wallet")).default;
const WalletTransaction = (await import("../src/lib/models/WalletTransaction")).default;
const Notification = (await import("../src/lib/models/Notification")).default;
const Referral = (await import("../src/lib/models/Referral")).default;
const TaxConfig = (await import("../src/lib/models/TaxConfig")).default;

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

// Department configuration mapping for tax rates & HSN codes
interface IDepartmentTax {
  cgst: number;
  sgst: number;
  igst: number;
  hsn: string;
}

const DEPARTMENT_TAXES: Record<string, IDepartmentTax> = {
  "electronics": { cgst: 9, sgst: 9, igst: 18, hsn: "8517" },
  "fashion": { cgst: 6, sgst: 6, igst: 12, hsn: "6109" },
  "grocery": { cgst: 0, sgst: 0, igst: 0, hsn: "1006" },
  "home-furniture": { cgst: 9, sgst: 9, igst: 18, hsn: "9403" },
  "sports-fitness": { cgst: 6, sgst: 6, igst: 12, hsn: "9506" },
  "appliances": { cgst: 9, sgst: 9, igst: 18, hsn: "8418" },
  "electrical": { cgst: 9, sgst: 9, igst: 18, hsn: "8536" },
  "beauty": { cgst: 9, sgst: 9, igst: 18, hsn: "3304" },
  "books": { cgst: 0, sgst: 0, igst: 0, hsn: "4901" },
  "baby-kids": { cgst: 6, sgst: 6, igst: 12, hsn: "9503" },
};

async function seed() {
  try {
    console.log("Connecting to the database...");
    const conn = await connectToDatabase();
    if (!conn) {
      throw new Error("Failed to connect to MongoDB.");
    }
    console.log("Connected successfully. Cleaning up collections...");

    // Delete existing records
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
    
    // Cleanup new models
    await Wallet.deleteMany({});
    await WalletTransaction.deleteMany({});
    await Notification.deleteMany({});
    await Referral.deleteMany({});
    await TaxConfig.deleteMany({});

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

    // Create Vendors (5 approved vendors)
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
        kycStatus: "verified",
        bankVerified: true,
        gstinVerified: true,
        panVerified: true,
        agreementSignedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        tcsRate: 0.5,
      });

      // Initialize Vendor Wallet
      await Wallet.create({
        userId: vendorUser._id,
        balance: 15000,
        isActive: true,
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
      kycStatus: "pending",
    });

    // Create Customers
    const customer1 = await User.create({
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      password: customerPasswordHash,
      phone: "+919876543210",
      isPhoneVerified: true,
      role: "customer",
      walletBalance: 250,
      isActive: true,
      isEmailVerified: true,
      referralCode: "RAHUL50",
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
      phone: "+919123456789",
      isPhoneVerified: true,
      role: "customer",
      walletBalance: 0,
      isActive: true,
      isEmailVerified: true,
      referralCode: "PRIYA10",
      referredBy: customer1._id,
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
      phone: "+919988776655",
      isPhoneVerified: true,
      role: "customer",
      walletBalance: 100,
      isActive: true,
      isEmailVerified: true,
      referralCode: "AMIT100",
    });

    // Create Customer Wallets
    const wallets = [
      { userId: customer1._id, balance: 250 },
      { userId: customer2._id, balance: 0 },
      { userId: customer3._id, balance: 100 },
    ];
    for (const w of wallets) {
      const wallet = await Wallet.create({
        userId: w.userId,
        balance: w.balance,
        isActive: true,
      });

      if (w.balance > 0) {
        await WalletTransaction.create({
          walletId: wallet._id,
          type: "credit",
          amount: w.balance,
          balanceAfter: w.balance,
          description: "Sign-up promotional bonus",
          referenceType: "manual",
          status: "completed",
        });
      }
    }

    // Seed Referrals
    await Referral.create({
      referrerId: customer1._id,
      referredUserId: customer2._id,
      code: "RAHUL50",
      reward: 50,
      status: "pending",
    });

    // Seed Notifications
    const usersToNotify = [customer1._id, customer2._id, customer3._id, admin._id];
    for (const uId of usersToNotify) {
      await Notification.create({
        userId: uId,
        type: "system",
        title: "Welcome to CosstechCom!",
        message: "Your account is active. Explore our 10 departments and enjoy seamless shopping.",
        isRead: false,
      });
    }

    // Create Delivery Partners
    await User.create({
      name: "Rajesh Express",
      email: "delivery.partner1@cosstechcom.com",
      password: deliveryPasswordHash,
      role: "delivery_partner",
      isActive: true,
      isEmailVerified: true,
    });

    await User.create({
      name: "Vikram Cargo",
      email: "delivery.partner2@cosstechcom.com",
      password: deliveryPasswordHash,
      role: "delivery_partner",
      isActive: true,
      isEmailVerified: true,
    });

    // Create Support Agent
    await User.create({
      name: "Sonia Care",
      email: "support.agent1@cosstechcom.com",
      password: supportPasswordHash,
      role: "support",
      isActive: true,
      isEmailVerified: true,
    });

    console.log("Seeding 3-level categories (10 departments)...");

    // 4. Seed Categories (10 Departments -> Sub-categories -> Leaf Categories)
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
      // New categories for v2.0
      {
        name: "Appliances",
        slug: "appliances",
        icon: "Tv",
        imageUrl: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?q=80&w=800&auto=format&fit=crop",
        bannerImageUrl: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?q=80&w=1200&auto=format&fit=crop",
        subs: [
          { name: "Large Appliances", slug: "large-appliances", subSubs: ["Refrigerators", "Washing Machines"] },
          { name: "Small Appliances", slug: "small-appliances", subSubs: ["Microwaves", "Blenders"] },
        ],
      },
      {
        name: "Electrical",
        slug: "electrical",
        icon: "Zap",
        imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800&auto=format&fit=crop",
        bannerImageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1200&auto=format&fit=crop",
        subs: [
          { name: "Lighting", slug: "lighting", subSubs: ["LED Bulbs", "Ceiling Lights"] },
          { name: "Wiring & Switches", slug: "wiring-switches", subSubs: ["Switchboards", "Extension Cords"] },
        ],
      },
      {
        name: "Beauty",
        slug: "beauty",
        icon: "Sparkles",
        imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop",
        bannerImageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop",
        subs: [
          { name: "Makeup", slug: "makeup", subSubs: ["Lipsticks", "Foundations"] },
          { name: "Skincare", slug: "skincare", subSubs: ["Moisturizers", "Face Wash"] },
        ],
      },
      {
        name: "Books",
        slug: "books",
        icon: "BookOpen",
        imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
        bannerImageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop",
        subs: [
          { name: "Fiction", slug: "fiction", subSubs: ["Novels", "Sci-Fi"] },
          { name: "Academic", slug: "academic", subSubs: ["Textbooks", "Exam Preparation"] },
        ],
      },
      {
        name: "Baby & Kids",
        slug: "baby-kids",
        icon: "Smile",
        imageUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=800&auto=format&fit=crop",
        bannerImageUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=1200&auto=format&fit=crop",
        subs: [
          { name: "Baby Care", slug: "baby-care", subSubs: ["Diapers", "Wipes"] },
          { name: "Toys", slug: "toys", subSubs: ["Board Games", "Dolls"] },
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

      // Create TaxConfig for Level 1 as default/fallback
      const taxRateData = DEPARTMENT_TAXES[dept.slug] || { cgst: 9, sgst: 9, igst: 18, hsn: "0000" };

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
          const fullLeafSlug = `${dept.slug}-${sub.slug}-${subSubSlug}`;
          
          // Level 3: Leaf-category
          const level3Doc = await Category.create({
            name: subSubName,
            slug: fullLeafSlug,
            level: 3,
            parentId: level2Doc._id,
            commissionRate: 10,
          });
          categoryMap.set(fullLeafSlug, level3Doc._id);

          // Seed TaxConfig for Leaf Category
          await TaxConfig.create({
            categoryId: level3Doc._id,
            hsnCode: taxRateData.hsn,
            cgstRate: taxRateData.cgst,
            sgstRate: taxRateData.sgst,
            igstRate: taxRateData.igst,
          });
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
      { name: "Philips", order: 11 },
      { name: "L'Oreal", order: 12 },
      { name: "Oxford University Press", order: 13 },
      { name: "Pampers", order: 14 },
      { name: "Lego", order: 15 },
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

    console.log("Seeding hand-crafted products...");

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
        hsnCode: "8517",
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
        hsnCode: "8517",
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
        hsnCode: "8518",
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
        hsnCode: "6404",
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
        hsnCode: "5007",
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
        hsnCode: "0902",
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
        hsnCode: "1006",
      },
      // Home & Furniture (Godrej -> Vendor 4 (DecoWood Home))
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
        hsnCode: "9403",
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
        hsnCode: "7323",
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
        hsnCode: "9506",
      },
      // Appliances
      {
        name: "Philips Smart LED TV 55 Inch",
        description: "4K Ultra HD Smart LED TV with Dolby Vision and Google Assistant integration.",
        price: 54999,
        salePrice: 42999,
        categorySlug: "appliances-large-appliances-refrigerators", // Map to first leaf for ease
        brandName: "Philips",
        vendorIndex: 0,
        gender: "None",
        imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "55 Inch", color: "Glossy Black", colorHex: COLOR_HEXES.black, stock: 12, sku: "PHL-TV-55-BL" },
        ],
        specifications: [
          { key: "Screen Size", value: "55 Inches" },
          { key: "Resolution", value: "4K Ultra HD" },
          { key: "Smart Platform", value: "Google TV" },
        ],
        tags: ["tv", "led", "philips", "4k"],
        hsnCode: "8528",
      },
      // Beauty
      {
        name: "L'Oreal Paris Revitalift Serum",
        description: "Anti-aging hyaluronic acid facial serum to intensely hydrate and replump skin.",
        price: 999,
        salePrice: 799,
        categorySlug: "beauty-skincare-moisturizers",
        brandName: "L'Oreal",
        vendorIndex: 1,
        gender: "None",
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "30 ml", color: "Clear Serum", colorHex: COLOR_HEXES.cream, stock: 150, sku: "LOR-REV-30" },
        ],
        specifications: [
          { key: "Volume", value: "30 ml" },
          { key: "Active Ingredient", value: "1.5% Hyaluronic Acid" },
        ],
        tags: ["skincare", "serum", "loreal", "beauty"],
        hsnCode: "3304",
      },
      // Books
      {
        name: "Oxford Dictionary of English",
        description: "The foremost authority on the English language, with comprehensive definition sets.",
        price: 1999,
        salePrice: 1699,
        categorySlug: "books-academic-textbooks",
        brandName: "Oxford University Press",
        vendorIndex: 3,
        gender: "None",
        imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80",
        variants: [
          { size: "Hardcover", color: "Blue Jacket", colorHex: COLOR_HEXES.blue, stock: 40, sku: "OXF-DICT-HC" },
        ],
        specifications: [
          { key: "Edition", value: "3rd Edition" },
          { key: "Format", value: "Hardcover" },
        ],
        tags: ["dictionary", "books", "oxford", "english"],
        hsnCode: "4901",
      },
    ];

    // Store seeded products
    const seededProductsList: any[] = [];

    // Create the hand-crafted products
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

      const productDoc = await Product.create({
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
        countryOfOrigin: "India",
        mfgDetails: `${t.brandName} Industries, Manufacturing Hub, India`,
        netQuantity: enrichedVariants[0]?.size || "1 Unit",
        hsnCode: t.hsnCode || "0000",
        metaTitle: `${t.name} - Buy Online | CosstechCom`,
        metaDescription: t.description.substring(0, 150),
      });

      seededProductsList.push(productDoc);
    }

    console.log("Dynamically generating remaining products to reach 100+ listings...");

    // 7. Seed remaining products dynamically to have 100+ products
    // We want at least 100 products. We have ~12 hand-crafted.
    // Let's loop over all Level 3 (leaf) categories and add products for each until we have 110 products.
    const allLeafCategories = await Category.find({ level: 3 });
    const allBrandsList = await Brand.find({ isActive: true });
    
    // Sample images by department for rich visuals
    const deptImageMap: Record<string, string[]> = {
      "electronics": [
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
      ],
      "fashion": [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=600&q=80"
      ],
      "grocery": [
        "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80"
      ],
      "home-furniture": [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80"
      ],
      "sports-fitness": [
        "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1605296867304-46d5465a25f1?auto=format&fit=crop&w=600&q=80"
      ],
      "appliances": [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80"
      ],
      "electrical": [
        "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80"
      ],
      "beauty": [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80"
      ],
      "books": [
        "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=600&q=80"
      ],
      "baby-kids": [
        "https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=600&q=80"
      ],
    };

    let generatedCount = 0;
    const targetCount = 110;
    const currentCount = seededProductsList.length;

    // Loop until we reach 110 products
    for (let i = 0; i < targetCount - currentCount; i++) {
      const category = allLeafCategories[i % allLeafCategories.length];
      
      // Determine department slug
      let deptSlug = "electronics";
      for (const dSlug of Object.keys(deptImageMap)) {
        if (category.slug.startsWith(dSlug)) {
          deptSlug = dSlug;
          break;
        }
      }

      // Pick a vendor (0-4)
      const vendorIndex = i % vendors.length;
      const vendorUser = vendors[vendorIndex];

      // Pick a brand
      const brandId = allBrandsList[i % allBrandsList.length]._id;

      // Select random image
      const imagesList = deptImageMap[deptSlug] || deptImageMap["electronics"];
      const imageUrl = imagesList[i % imagesList.length];

      const price = Math.round(200 + Math.random() * 9800);
      const salePrice = Math.round(price * 0.9); // 10% off
      
      const prodName = `${category.name} Premium Pro Model ${100 + i}`;
      const slug = `${prodName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
      
      const sizeValue = deptSlug === "fashion" ? `${7 + (i % 4)}` : (deptSlug === "electronics" ? "128GB" : "Standard");

      const productDoc = await Product.create({
        name: prodName,
        slug: slug,
        description: `Premium high-quality ${category.name} designed for excellent daily performance and efficiency.`,
        brand: brandId,
        vendorId: vendorUser._id,
        category: category._id,
        gender: deptSlug === "fashion" ? (i % 2 === 0 ? "Men" : "Women") : "None",
        images: [{ url: imageUrl, public_id: `dynamic-placeholder-${slug}` }],
        variants: [
          {
            size: sizeValue,
            color: "Carbon Black",
            colorHex: COLOR_HEXES.black,
            stock: 30,
            sku: `COSS-PROD-${i}-${Date.now().toString().slice(-4)}`
          }
        ],
        price: price,
        salePrice: salePrice,
        returnDays: 7,
        rating: { average: 4.2, count: 1 },
        isFeatured: Math.random() > 0.7,
        isNewArrival: true,
        isActive: true,
        approvalStatus: "approved",
        specifications: [
          { key: "Warranty", value: "1 Year Domestic Warranty" },
          { key: "Country of Origin", value: "India" }
        ],
        freeShipping: salePrice > 1000,
        estimatedDeliveryDays: 3,
        tags: [deptSlug, category.name.toLowerCase()],
        countryOfOrigin: "India",
        mfgDetails: "CosstechCom Trusted Vendor Network, India",
        netQuantity: "1 Unit",
        hsnCode: DEPARTMENT_TAXES[deptSlug]?.hsn || "0000",
        metaTitle: `${prodName} - Lowest Price Online | CosstechCom`,
        metaDescription: `Buy ${prodName} at the best price online with fast delivery, secure payments, and easy returns on CosstechCom.`,
      });

      seededProductsList.push(productDoc);
      generatedCount++;
    }

    console.log(`Successfully generated ${generatedCount} dynamic products. Total catalog size: ${seededProductsList.length}.`);

    console.log("Seeding banners...");

    // 8. Seed Banners (Marketplace style)
    await Banner.create([
      {
        title: "Big Electronics Sale",
        subtitle: "Up to 40% Off on Top Smartphones & Laptops",
        imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80",
        linkUrl: "/shop?category=electronics",
        order: 1,
        isActive: true,
        tagline: "Mega Tech Deals",
        cta: "Shop Electronics",
        badgeTitle: "Mobiles & Laptops",
        badgePrice: "Up to 40% Off",
        objectPosition: "object-center",
      },
      {
        title: "Designer Sarees & Ethnic Styles",
        subtitle: "Luxury collections for the festive season",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
        linkUrl: "/shop?category=fashion-womens-wear-sarees",
        order: 2,
        isActive: true,
        tagline: "Atelier Festive Wear",
        cta: "Shop Sarees",
        badgeTitle: "Banarasi Silk Saree",
        badgePrice: "From ₹38,000",
        objectPosition: "object-center",
      },
      {
        title: "Groceries Delivered in Hours",
        subtitle: "Flat 10% instant cashback on staples & tea",
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
        linkUrl: "/shop?category=grocery",
        order: 3,
        isActive: true,
        tagline: "Supermarket Staples",
        cta: "Order Groceries",
        badgeTitle: "Staples & Tea Blend",
        badgePrice: "Flat 10% Cashback",
        objectPosition: "object-center",
      },
    ]);

    console.log("Seeding coupons...");

    // 9. Seed Coupons
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
