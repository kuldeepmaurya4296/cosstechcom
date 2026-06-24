"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User, Heart } from "lucide-react";
import { useCart } from "@/lib/cart-store";

type Item = { href: string; label: string; icon: typeof Home; exact?: boolean; badge?: boolean };

const items: Item[] = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/shop", label: "Shop", icon: Search },
  { href: "/cart", label: "Cart", icon: ShoppingBag, badge: true },
  { href: "/account/wishlist", label: "Saved", icon: Heart },
  { href: "/account", label: "Account", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
      {/* Glassmorphic capsule bar */}
      <div className="mx-3 mb-3 bg-card/96 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5">
          {items.map(({ href, label, icon: Icon, badge, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");

            return (
              <Link
                key={label}
                href={href}
                className="relative flex flex-col items-center justify-center gap-0.5 py-3 px-1 cursor-pointer transition-all group"
              >
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-b-full" />
                )}

                {/* Icon wrapper */}
                <div
                  className={`relative flex items-center justify-center h-7 w-7 rounded-xl transition-all duration-200 ${
                    active ? "bg-primary/10 scale-110" : "group-hover:bg-muted scale-100"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  {badge && count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-cognac text-cream text-[8px] font-bold rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center leading-none">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[9px] font-semibold tracking-wide transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
