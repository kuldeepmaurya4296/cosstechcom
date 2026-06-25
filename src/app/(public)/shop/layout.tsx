import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Products — CosstechCom",
  description:
    "Browse our full collection of premium products across multiple categories including Electronics, Fashion, Grocery, Home, and Sports on CosstechCom.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
