// Data collection: categories
export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  productCount: number;
}

export const categories: Category[] = [
  {
    id: "c1",
    slug: "electronics",
    name: "Electronics",
    description: "Smartphones, laptops, headphones, smart devices, and accessories.",
    productCount: 3,
  },
  {
    id: "c2",
    slug: "fashion",
    name: "Fashion",
    description: "Apparel, footwear, accessories, and designer collections.",
    productCount: 2,
  },
  {
    id: "c3",
    slug: "grocery",
    name: "Grocery",
    description: "Daily essentials, gourmet food, beverages, and pantry staples.",
    productCount: 2,
  },
  {
    id: "c4",
    slug: "home-furniture",
    name: "Home & Furniture",
    description: "Premium furniture, home decor, cookware, and kitchen appliances.",
    productCount: 2,
  },
  {
    id: "c5",
    slug: "sports-fitness",
    name: "Sports & Fitness",
    description: "Workout gear, exercise equipment, sports shoes, and accessories.",
    productCount: 1,
  },
];
