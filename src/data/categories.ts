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
    slug: "mens",
    name: "Men's Footwear",
    description: "Daily slippers, casual sandals, sports shoes, and formal groom styles.",
    productCount: 3,
  },
  {
    id: "c2",
    slug: "womens",
    name: "Women's Footwear",
    description: "Elegant sandals, comfort home slippers, and wedding bridal heels.",
    productCount: 1,
  },
  {
    id: "c3",
    slug: "kids",
    name: "Kids' Footwear",
    description: "Durable school shoes, sandals, and slippers for boys and girls of all ages.",
    productCount: 2,
  },
  {
    id: "c4",
    slug: "bridal",
    name: "Bridal & Groom",
    description: "Exclusive wedding and groom collections for special occasions.",
    productCount: 2,
  },
];
