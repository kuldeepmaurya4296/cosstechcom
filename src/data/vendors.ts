// Data collection: vendors
export interface Vendor {
  id: string;
  name: string;
  tagline: string;
  email: string;
  joinedAt: string;
  productsCount: number;
  revenue: number;
  rating: number;
  payoutsPending: number;
  status: "active" | "pending";
}

export const vendors: Vendor[] = [
  {
    id: "v1",
    name: "Lakhani Footwear",
    tagline: "Reputed daily comfort & canvas shoes since 1966",
    email: "care@lakhani.com",
    joinedAt: "2025-01-10",
    productsCount: 2,
    revenue: 184200,
    rating: 4.8,
    payoutsPending: 4280,
    status: "active",
  },
  {
    id: "v2",
    name: "Touch Footwear",
    tagline: "Premium design, style & fashion block heels",
    email: "info@touchfeet.com",
    joinedAt: "2025-02-15",
    productsCount: 2,
    revenue: 92840,
    rating: 4.7,
    payoutsPending: 1840,
    status: "active",
  },
  {
    id: "v3",
    name: "Paragon",
    tagline: "India's most trusted daily slippers and sandals",
    email: "support@paragonfootwear.com",
    joinedAt: "2025-01-01",
    productsCount: 2,
    revenue: 248200,
    rating: 4.9,
    payoutsPending: 5920,
    status: "active",
  },
  {
    id: "v4",
    name: "Goldstar",
    tagline: "Durable walking shoes & sports sneakers",
    email: "contact@goldstarshoes.com",
    joinedAt: "2025-03-20",
    productsCount: 2,
    revenue: 48200,
    rating: 4.6,
    payoutsPending: 920,
    status: "active",
  },
];

export const currentVendor = vendors[0];
