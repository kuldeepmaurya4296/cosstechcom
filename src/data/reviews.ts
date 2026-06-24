// Data collection: reviews
export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  verified: boolean;
}

export const reviews: Review[] = [
  {
    id: "r1",
    productId: "p1",
    userName: "Aarav S.",
    rating: 5,
    title: "Perfect for my wedding!",
    body: "Wore this Lakhani jutti for my wedding ceremony and received so many compliments. It matched my sherwani perfectly and was very comfortable to stand in for hours.",
    createdAt: "2025-04-12",
    verified: true,
  },
  {
    id: "r2",
    productId: "p1",
    userName: "Karan D.",
    rating: 5,
    title: "High quality embroidery",
    body: "The golden thread work is extremely detailed and premium. Fits perfectly and looks very elegant.",
    createdAt: "2025-03-22",
    verified: true,
  },
  {
    id: "r3",
    productId: "p2",
    userName: "Priya R.",
    rating: 5,
    title: "Stunning bridal sandals",
    body: "I was worried about walking in heels all night, but the block heel on these Touch sandals made it so easy. The stonework is absolutely beautiful!",
    createdAt: "2025-05-05",
    verified: true,
  },
  {
    id: "r4",
    productId: "p3",
    userName: "Rohan V.",
    rating: 5,
    title: "Ultimate daily comfort",
    body: "Very durable sandals from Paragon. Perfect for daily walking and rough use. Highly recommend!",
    createdAt: "2025-05-01",
    verified: true,
  },
  {
    id: "r5",
    productId: "p4",
    userName: "Amit K.",
    rating: 5,
    title: "Best running shoes",
    body: "Extremely lightweight and comfortable. Goldstar never disappoints when it comes to durable sports shoes.",
    createdAt: "2025-05-10",
    verified: true,
  },
];

export const reviewsByProduct = (pid: string) => reviews.filter((r) => r.productId === pid);
