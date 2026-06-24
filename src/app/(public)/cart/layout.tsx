import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Bag — Raja Boot House",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
