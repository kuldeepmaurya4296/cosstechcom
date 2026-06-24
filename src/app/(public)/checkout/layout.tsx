import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Checkout — Raja Boot House",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
