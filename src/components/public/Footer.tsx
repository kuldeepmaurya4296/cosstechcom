"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { useTheme } from "@/components/public/ThemeProvider";
import { Sun, Moon, MapPin, Phone, Mail, Shield } from "lucide-react";

const shopLinks = [
  { label: "All Footwear", href: "/shop" },
  { label: "Men's Collection", href: "/shop?category=mens" },
  { label: "Women's Collection", href: "/shop?category=womens" },
  { label: "Bridal & Wedding", href: "/shop?category=bridal" },
  { label: "Sports & Athletic", href: "/shop?category=sports" },
  { label: "Kids' Footwear", href: "/shop?category=kids" },
];

const customerLinks = [
  { label: "Your Account", href: "/account" },
  { label: "Track Orders", href: "/account/orders" },
  { label: "Your Wishlist", href: "/account/wishlist" },
  { label: "Shopping Bag", href: "/cart" },
  { label: "Register / Login", href: "/login" },
  { label: "System Documentation", href: "/docs" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Shipping & Delivery", href: "/delivery-policy" },
  { label: "Return & Refund Policy", href: "/refund-policy" },
];

export function Footer() {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="bg-cream text-charcoal border-t border-border/50 mt-12 md:mt-16 lg:mt-24">
      {/* Main Links Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-10">
        <div className="md:col-span-2">
          <Logo size={44} />
          <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
            CosstechCom: Your premium multi-vendor marketplace for electronics, fashion, footwear, and lifestyle essentials. Shop from certified sellers with secure payments and fast delivery.
          </p>
          {/* Payment badges */}
          <div className="mt-6">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-bold mb-2.5">
              Secure Payments Via
            </p>
            <div className="flex flex-wrap gap-2">
              {["UPI", "Razorpay", "Visa", "Mastercard", "COD"].map((badge) => (
                <span
                  key={badge}
                  className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 bg-cream/40 border border-border/60 rounded text-muted-foreground"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold mb-4 uppercase tracking-[0.2em] text-cognac">
            Shop Departments
          </h4>
          <ul className="space-y-2.5">
            {shopLinks.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="text-sm text-muted-foreground hover:text-charcoal transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-bold mb-4 uppercase tracking-[0.2em] text-cognac">
            Seller Portal
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link href="/vendor/register" className="text-sm text-muted-foreground hover:text-charcoal transition-colors">
                Sell on CosstechCom
              </Link>
            </li>
            <li>
              <Link href="/vendor" className="text-sm text-muted-foreground hover:text-charcoal transition-colors">
                Seller Dashboard
              </Link>
            </li>
            {customerLinks.filter(l => l.label !== "System Documentation").map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="text-sm text-muted-foreground hover:text-charcoal transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-bold mb-4 uppercase tracking-[0.2em] text-cognac">
            Legal &amp; Policy
          </h4>
          <ul className="space-y-2.5">
            {legalLinks.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="text-sm text-muted-foreground hover:text-charcoal transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/40 pb-20 md:pb-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 text-xs text-muted-foreground/80 text-center sm:text-left items-center flex-wrap">
            <span>© 2025–2026 CosstechCom Marketplace. All rights reserved.</span>
            {/* <span className="hidden sm:inline">·</span>
            <span className="flex flex-wrap items-center justify-center gap-1">
              Designed &amp; Developed by{" "}
              <a
                href="https://kuldeep.maurya-tech.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cognac hover:underline font-bold transition-all"
              >
                Kuldeep Maurya
              </a>{" "}
              from{" "}
              <a
                href="https://maurya-tech.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cognac hover:underline font-bold transition-all"
              >
                Maurya Technologies &amp; Services
              </a>
              <span className="mx-1">·</span>
              <a
                href="https://wa.me/916263638053"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-750 transition-colors"
                title="Chat with Developer on WhatsApp"
              >
                <svg
                  className="h-3.5 w-3.5 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.632 2.016 14.11 1.01 11.999 1.01c-5.432 0-9.855 4.37-9.86 9.8.001 1.77.475 3.5 1.374 5.02L2.501 21.5l5.9-1.516c-1.45-1.15-1.754-1.28-1.754-1.28zm10.748-6.195c-.29-.145-1.714-.847-1.98-.942-.265-.096-.458-.145-.65.145-.192.29-.747.942-.916 1.133-.169.19-.338.216-.628.072-.29-.145-1.226-.452-2.336-1.442-.864-.77-1.448-1.72-1.618-2.01-.168-.29-.018-.448.127-.592.13-.13.29-.338.434-.507.145-.17.193-.29.29-.483.096-.193.048-.361-.024-.506-.072-.145-.65-1.566-.89-2.146-.236-.566-.475-.49-.65-.498-.17-.008-.362-.01-.555-.01-.193 0-.506.072-.77.362-.266.29-1.013.99-1.013 2.416 0 1.42 1.037 2.793 1.18 2.987.145.193 2.04 3.114 4.94 4.368.69.298 1.23.476 1.65.61.693.22 1.325.19 1.822.115.556-.084 1.714-.7 1.956-1.374.24-.676.24-1.256.169-1.374-.07-.118-.264-.19-.554-.336z" />
                </svg>
                <span>WhatsApp</span>
              </a>
            </span> */}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <Shield className="h-3 w-3 text-cognac/80" />
              <span>256-bit SSL Secured</span>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/80 hover:border-charcoal/40 text-muted-foreground hover:text-charcoal transition cursor-pointer text-[10px] uppercase font-bold tracking-wider"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-cognac" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
