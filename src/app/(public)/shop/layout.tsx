import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Boots — Raja Boot House",
  description:
    "Browse our full collection of  leather boots. Chelsea, work, dress, desert, riding, women's. Built to outlast.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
