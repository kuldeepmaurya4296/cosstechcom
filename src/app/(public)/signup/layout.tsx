import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register — Raja Boot House",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
