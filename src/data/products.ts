// Data collection: products
import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";
import p5 from "@/assets/product-5.jpg";
import p6 from "@/assets/product-6.jpg";

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  brand?: string;
  brandId?: string;
  vendorId?: string;
  price: number;
  compareAt?: number;
  variants?: {
    size: number;
    color: string;
    colorHex: string;
    stock: number;
    sku: string;
    images: { url: string; public_id: string }[];
  }[];
  image: string;
  gallery: string[];
  description: string;
  details: string[];
  colors: string[];
  sizes: number[];
  stock: number;
  rating: number;
  reviewsCount: number;
  badge?: "new" | "bestseller" | "sale";
  createdAt: string;
}

export const products: Product[] = [
  {
    id: "p1",
    slug: "lakhani-groom-royal-jutti",
    name: "Lakhani Groom Royal Jutti",
    category: "bridal",
    vendorId: "v1",
    price: 289,
    compareAt: 340,
    image: p1.src,
    gallery: [p1.src, p2.src, p3.src],
    description:
      "Exquisite hand-embroidered wedding sherwani jutti by Lakhani. Built for maximum comfort and premium style on your special day.",
    details: [
      "Premium silk upper with golden thread embroidery",
      "Cushioned inner lining for long ceremonies",
      "Durable leather sole",
      "Traditional curved toe styling",
    ],
    colors: ["Gold", "Cream"],
    sizes: [7, 8, 9, 10, 11],
    stock: 24,
    rating: 4.8,
    reviewsCount: 142,
    badge: "bestseller",
    createdAt: "2025-03-12",
  },
  {
    id: "p2",
    slug: "touch-premium-bridal-block-sandals",
    name: "Touch Premium Bridal Block Sandals",
    category: "bridal",
    vendorId: "v2",
    price: 349,
    image: p2.src,
    gallery: [p2.src, p3.src, p1.src],
    description:
      "Stunning wedding heels featuring intricate stone work and a highly comfortable block heel by Touch. Designed for brides who value comfort.",
    details: [
      "Glimmering stone and bead strap highlights",
      "Comfortable 2.5-inch block heel",
      "Soft slip-resistant footbed",
      "Adjustable ankle strap clasp",
    ],
    colors: ["Silver", "Golden", "Rose Gold"],
    sizes: [5, 6, 7, 8, 9],
    stock: 18,
    rating: 4.9,
    reviewsCount: 89,
    badge: "new",
    createdAt: "2025-05-02",
  },
  {
    id: "p3",
    slug: "paragon-solemate-mens-sandals",
    name: "Paragon Solemate Men's Sandals",
    category: "mens",
    vendorId: "v3",
    price: 199,
    image: p3.src,
    gallery: [p3.src, p1.src, p2.src],
    description:
      "Highly durable and comfortable daily-wear sandals from Paragon's premium Solemate collection. Built to outlast rough streets.",
    details: [
      "Waterproof synthetic straps",
      "Ergonomic arch support footbed",
      "Strong traction rubber outer sole",
      "Velcro closure system",
    ],
    colors: ["Black", "Brown"],
    sizes: [6, 7, 8, 9, 10, 11],
    stock: 35,
    rating: 4.7,
    reviewsCount: 56,
    createdAt: "2025-01-18",
  },
  {
    id: "p4",
    slug: "goldstar-active-mens-sports",
    name: "Goldstar Active Men's Sports Shoes",
    category: "mens",
    vendorId: "v4",
    price: 299,
    compareAt: 350,
    image: p4.src,
    gallery: [p4.src, p2.src, p1.src],
    description:
      "Lightweight, breathable, and highly cushioned running and walking sports shoes by Goldstar. Excellent for daily exercise.",
    details: [
      "Breathable mesh ventilation upper",
      "Highly shock-absorbent EVA midsole",
      "Slip-resistant grip outsole",
      "Lightweight design weight distribution",
    ],
    colors: ["Blue", "Grey", "Black"],
    sizes: [7, 8, 9, 10, 11],
    stock: 32,
    rating: 4.6,
    reviewsCount: 211,
    badge: "sale",
    createdAt: "2024-11-04",
  },
  {
    id: "p5",
    slug: "lakhani-soft-step-womens-slippers",
    name: "Lakhani Soft-Step Women's Slippers",
    category: "womens",
    vendorId: "v1",
    price: 149,
    image: p5.src,
    gallery: [p5.src, p2.src, p3.src],
    description:
      "Ultra-soft and featherlight home slippers for women by Lakhani. Features a cushioned footbed for daily stress-free steps.",
    details: [
      "Velvety soft fabric upper strap",
      "Ergonomically contoured comfort sole",
      "Flexible rubber grip",
      "Extremely lightweight",
    ],
    colors: ["Pink", "Red", "Blue"],
    sizes: [5, 6, 7, 8, 9],
    stock: 45,
    rating: 4.9,
    reviewsCount: 38,
    createdAt: "2025-04-22",
  },
  {
    id: "p6",
    slug: "touch-kids-active-play-shoes",
    name: "Touch Kids' Active Play Shoes",
    category: "kids",
    vendorId: "v2",
    price: 179,
    image: p6.src,
    gallery: [p6.src, p1.src, p4.src],
    description:
      "Tough, lightweight, and easy-to-wear school and playtime velcro shoes for children by Touch. Protects feet during high activity.",
    details: [
      "Dual velcro straps for self-dressing",
      "Impact-absorbing rubber toe cap",
      "Breathable fabric inner lining",
      "Bright color trims",
    ],
    colors: ["Red", "Blue", "Black"],
    sizes: [2, 3, 4, 5, 6],
    stock: 14,
    rating: 4.8,
    reviewsCount: 97,
    badge: "new",
    createdAt: "2025-05-20",
  },
  {
    id: "p7",
    slug: "paragon-walk-free-mens-formal",
    name: "Paragon Walk-Free Men's Formal Shoes",
    category: "mens",
    vendorId: "v3",
    price: 349,
    image: p3.src,
    gallery: [p3.src, p1.src],
    description:
      "Polished and lightweight synthetic formal derby shoes by Paragon. Designed to keep feet strain-free during formal office hours.",
    details: [
      "Glossy premium synthetic finish",
      "Padded memory-foam insole",
      "Low stacked heel style",
      "Breathable inner sole wall",
    ],
    colors: ["Black", "Brown"],
    sizes: [7, 8, 9, 10, 11, 12],
    stock: 20,
    rating: 4.7,
    reviewsCount: 64,
    createdAt: "2025-02-11",
  },
  {
    id: "p8",
    slug: "goldstar-kids-school-shoes",
    name: "Goldstar Kids' School Shoes",
    category: "kids",
    vendorId: "v4",
    price: 129,
    image: p2.src,
    gallery: [p2.src, p4.src],
    description:
      "Standard uniform-compliant black school shoes for boys and girls from Goldstar. Highly durable synthetic leather build.",
    details: [
      "Durable black synthetic leather outer",
      "Lace-up fastening system for secure fit",
      "Sturdy wear-resistant rubber sole",
      "Inner lining heel padding",
    ],
    colors: ["Black"],
    sizes: [1, 2, 3, 4, 5, 6],
    stock: 50,
    rating: 4.8,
    reviewsCount: 42,
    badge: "bestseller",
    createdAt: "2024-12-30",
  },
];

export const featuredProducts = () =>
  products.filter((p) => p.badge === "bestseller" || p.badge === "new");
export const findProduct = (slug: string) => products.find((p) => p.slug === slug);
export const productsByCategory = (cat: string) => products.filter((p) => p.category === cat);
