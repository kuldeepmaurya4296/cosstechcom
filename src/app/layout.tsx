import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import Script from "next/script";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { Watermark } from "@/components/shared/Watermark";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cosstechcom.com"),
  title: {
    default: "CosstechCom — India's Online Multi-Vendor Marketplace",
    template: "%s | CosstechCom",
  },
  description:
    "Multi-vendor marketplace for electronics, fashion, grocery, home, appliances, electrical, sports, beauty, books, and more.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CosstechCom",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-96x96.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://cosstechcom.com",
    siteName: "CosstechCom",
    images: [
      {
        url: "/assets/hero-boots.jpg",
        width: 1200,
        height: 630,
        alt: "CosstechCom Multi-Vendor Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CosstechCom",
    description: "India's Online Multi-Vendor Marketplace.",
    images: ["/assets/hero-boots.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Set theme before first paint to avoid a flash of the wrong theme.
            Mirrors ThemeProvider: saved `cosstechcom-theme` wins, else system preference.
            beforeInteractive runs before hydration (Next hoists it into <head>). */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('cosstechcom-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`}
        </Script>
        <Providers>
          {children}
          <Toaster richColors position="bottom-right" />
          <Watermark />
        </Providers>
      </body>
    </html>
  );
}
