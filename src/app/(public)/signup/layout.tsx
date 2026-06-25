import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register — CosstechCom",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
