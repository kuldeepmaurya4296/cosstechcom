"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingBag, User, Heart, Menu, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-store";
import { Logo } from "@/components/shared/Logo";
import { categories as fallbackCategories } from "@/data/categories";
import { formatINR } from "@/lib/format";
import { useSession } from "next-auth/react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { NotificationCenter } from "./NotificationCenter";

const SearchModal = dynamic(() => import("./SearchModal").then((mod) => mod.SearchModal), {
  ssr: false,
});

const NavDrawer = dynamic(() => import("./NavDrawer").then((mod) => mod.NavDrawer), { ssr: false });

export function Navbar() {
  const { count } = useCart();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "customer";
  const accountLink = role === "admin" ? "/admin" : role === "vendor" ? "/vendor" : "/account";
  const path = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([
    "Welcome to CosstechCom Marketplace",
    "Free shipping on orders over ₹2000",
    "Top Brands. Verified Sellers. Great Deals.",
  ]);
  const [announcementsActive, setAnnouncementsActive] = useState(true);

  // Autocomplete search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [resultsVisible, setResultsVisible] = useState(false);

  // Dynamic categories mega-menu tree
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [categoryTree, setCategoryTree] = useState<any[]>([]);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const [activeMoreSub, setActiveMoreSub] = useState<string | null>(null);

  // Search modal state (for mobile)
  const [searchOpen, setSearchOpen] = useState(false);

  // Helper to build 3-level tree
  const buildCategoryTree = (categories: any[]) => {
    const tree: any[] = [];
    const map = new Map<string, any>();

    categories.forEach((cat) => {
      map.set(cat.id || cat._id.toString(), { ...cat, children: [] });
    });

    categories.forEach((cat) => {
      const id = cat.id || cat._id.toString();
      const node = map.get(id);
      if (cat.parentId) {
        const parentIdStr = cat.parentId.toString();
        const parentNode = map.get(parentIdStr);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          tree.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree.filter((node) => node.level === 1 || !node.parentId);
  };

  // Detect scroll for enhanced header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      if (menuOpen) setMenuOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  // Load category list and build tree
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategoriesList(data);
          setCategoryTree(buildCategoryTree(data));
        } else {
          setCategoriesList(fallbackCategories);
          setCategoryTree(buildCategoryTree(fallbackCategories));
        }
      })
      .catch(() => {
        setCategoriesList(fallbackCategories);
        setCategoryTree(buildCategoryTree(fallbackCategories));
      });

    fetch("/api/announcements")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.list)) {
          setAnnouncements(data.list);
          setAnnouncementsActive(data.isActive);
        }
      })
      .catch((err) => console.error("Failed to load announcements", err));

    setMounted(true);
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(() => {
      fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSearchResults(data);
          }
        })
        .catch((err) => console.error("Search failed:", err));
    }, 200);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const renderMarqueeItems = () => {
    return (
      <>
        {announcements.map((item, idx) => (
          <span key={`ann-${idx}`} className="flex items-center gap-2">
            <span className="opacity-75">✦</span> {item}
          </span>
        ))}
        {/* <span className="flex items-center gap-1.5 normal-case tracking-normal">
          <span className="opacity-75">✦</span> Designed &amp; Developed by{" "}
          <a
            href="https://kuldeep.maurya-tech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cognac hover:underline font-bold transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            Kuldeep Maurya
          </a>{" "}
          from{" "}
          <a
            href="https://maurya-tech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cognac hover:underline font-bold transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            Maurya Technologies
          </a>
        </span> */}
      </>
    );
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
            ? "bg-cream/92 backdrop-blur-lg shadow-sm border-b border-border/60"
            : "bg-cream/85 backdrop-blur-md border-b border-border"
          }`}
      >
        {/* Announcement strip */}
        {announcementsActive && announcements.length > 0 && (
          <div className="relative overflow-hidden bg-charcoal text-cream text-[10px] tracking-[0.2em] uppercase py-2 flex w-full select-none border-b border-border/10">
            <div className="flex animate-marquee gap-16 whitespace-nowrap pr-16 hover:[animation-play-state:paused] cursor-pointer">
              {renderMarqueeItems()}
            </div>
            <div
              className="flex animate-marquee gap-16 whitespace-nowrap pr-16 hover:[animation-play-state:paused] cursor-pointer"
              aria-hidden="true"
            >
              {renderMarqueeItems()}
            </div>
          </div>
        )}

        {/* Deals sub-header (desktop only) */}
        <div className="hidden md:block bg-muted/30 border-b border-border/40 py-1.5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="text-primary flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                Flash Sale Live!
              </span>
              <Link href="/shop?discount=20" className="hover:text-foreground transition-colors">
                Deals of the Day
              </Link>
              <Link href="/shop?featured=true" className="hover:text-foreground transition-colors">
                Featured Sellers
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/vendor/register" className="hover:text-foreground transition-colors text-cognac">
                Sell on CosstechCom
              </Link>
              <Link href="/account/orders" className="hover:text-foreground transition-colors">
                Track My Order
              </Link>
            </div>
          </div>
        </div>

        <div className={`container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 relative transition-all duration-300 ${
          scrolled ? "h-14 md:h-16" : "h-16 md:h-20"
        }`}>
          {/* Mobile menu toggle */}
          <button
            className="xl:hidden p-2 -ml-2 hover:bg-muted rounded-xl transition cursor-pointer"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Logo size={36} />

          {/* Desktop Navigation mega-menus */}
          <nav className="hidden xl:flex items-center gap-x-4 xl:gap-x-6 flex-initial justify-center">
            <Link
              href="/shop"
              className={`text-xs font-bold hover:text-primary transition-colors uppercase tracking-[0.15em] pb-1 border-b-2 whitespace-nowrap ${path === "/shop" && !searchParams.get("category")
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground/75 hover:border-primary/40"
                }`}
            >
              Shop All
            </Link>

            {(() => {
              const preferredSlugs = ["fashion", "electronics", "grocery", "home-furniture"];
              const mainCategories = categoryTree.filter((cat) => preferredSlugs.includes(cat.slug));
              mainCategories.sort((a, b) => preferredSlugs.indexOf(a.slug) - preferredSlugs.indexOf(b.slug));
              const otherCategories = categoryTree.filter((cat) => !preferredSlugs.includes(cat.slug));

              return (
                <>
                  {mainCategories.map((lvl1) => {
                    const isActive = searchParams.get("category") === lvl1.slug;
                    return (
                      <div
                        key={lvl1.id}
                        className="relative py-2"
                        onMouseEnter={() => setActiveMega(lvl1.id)}
                        onMouseLeave={() => setActiveMega(null)}
                      >
                        <button
                          className={`text-xs font-bold hover:text-primary transition-colors uppercase tracking-[0.15em] flex items-center gap-1 cursor-pointer pb-1 border-b-2 whitespace-nowrap ${isActive
                              ? "border-primary text-primary"
                              : "border-transparent text-foreground/75 hover:border-primary/40"
                            }`}
                        >
                          {lvl1.name}
                          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${activeMega === lvl1.id ? "rotate-180" : ""}`} />
                        </button>

                        {/* Mega Menu Dropdown */}
                        {activeMega === lvl1.id && lvl1.children && lvl1.children.length > 0 && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-[600px] bg-card border border-border shadow-2xl rounded-2xl p-6 z-50 grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                            {lvl1.children.map((lvl2: any) => (
                              <div key={lvl2.id} className="space-y-2">
                                <Link
                                  href={`/shop?category=${lvl2.slug}`}
                                  className="font-bold text-[11px] uppercase tracking-wider text-primary hover:underline block"
                                >
                                  {lvl2.name}
                                </Link>
                                <ul className="space-y-1.5">
                                  {lvl2.children.map((lvl3: any) => (
                                    <li key={lvl3.id}>
                                      <Link
                                        href={`/shop?category=${lvl3.slug}`}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors block"
                                      >
                                        {lvl3.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* More Categories Dropdown */}
                  {otherCategories.length > 0 && (
                    <div
                      className="relative py-2"
                      onMouseEnter={() => setActiveMega("more")}
                      onMouseLeave={() => {
                        setActiveMega(null);
                        setActiveMoreSub(null);
                      }}
                    >
                      <button
                        className={`text-xs font-bold hover:text-primary transition-colors uppercase tracking-[0.15em] flex items-center gap-1 cursor-pointer pb-1 border-b-2 whitespace-nowrap border-transparent text-foreground/75 hover:border-primary/40`}
                      >
                        More
                        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${activeMega === "more" ? "rotate-180" : ""}`} />
                      </button>

                      {activeMega === "more" && (
                        <div className="absolute top-full left-0 w-[240px] bg-card border border-border shadow-2xl rounded-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col gap-1">
                          {otherCategories.map((lvl1) => (
                            <div
                              key={lvl1.id}
                              className="relative"
                              onMouseEnter={() => setActiveMoreSub(lvl1.id)}
                            >
                              <div
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-foreground/80 hover:text-primary hover:bg-muted/80 transition cursor-pointer ${
                                  activeMoreSub === lvl1.id ? "bg-muted/80 text-primary" : ""
                                }`}
                              >
                                <Link href={`/shop?category=${lvl1.slug}`} className="flex-1">
                                  {lvl1.name}
                                </Link>
                                {lvl1.children && lvl1.children.length > 0 && (
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </div>

                              {/* Flyout Sub-menu */}
                              {activeMoreSub === lvl1.id && lvl1.children && lvl1.children.length > 0 && (
                                <div className="absolute top-0 left-full ml-2 w-[480px] bg-card border border-border shadow-2xl rounded-2xl p-5 z-50 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-200">
                                  {lvl1.children.map((lvl2: any) => (
                                    <div key={lvl2.id} className="space-y-1.5">
                                      <Link
                                        href={`/shop?category=${lvl2.slug}`}
                                        className="font-bold text-[10px] uppercase tracking-wider text-primary hover:underline block"
                                      >
                                        {lvl2.name}
                                      </Link>
                                      <ul className="space-y-1">
                                        {lvl2.children.map((lvl3: any) => (
                                          <li key={lvl3.id}>
                                            <Link
                                              href={`/shop?category=${lvl3.slug}`}
                                              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors block"
                                            >
                                              {lvl3.name}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </nav>

          {/* Inline Autocomplete Search (Desktop only) */}
          <div className="hidden lg:flex items-center gap-2 bg-muted/50 border border-border/40 rounded-full px-4 py-1.5 max-w-[240px] xl:max-w-[320px] flex-1 relative group">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search products, brands..."
              className="bg-transparent border-none outline-none text-xs w-full font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setResultsVisible(true)}
              onBlur={() => setTimeout(() => setResultsVisible(false), 200)}
            />
            {resultsVisible && searchQuery && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-card border border-border shadow-2xl rounded-2xl p-3 z-50 max-h-[300px] overflow-y-auto mt-2 space-y-2.5">
                {searchResults.slice(0, 5).map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/shop/${p.slug}`}
                    className="flex items-center gap-3 hover:bg-muted/80 p-2 rounded-xl transition"
                  >
                    <img
                      src={p.image || "/assets/product-placeholder.jpg"}
                      className="h-9 w-9 object-cover rounded-lg border border-border/50 shrink-0"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate text-foreground leading-snug">
                        {p.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground/80 mt-0.5">
                        {p.brand} · ₹{p.price}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Icon Actions Bar */}
          <div className="flex items-center gap-0.5 md:gap-1">
            {/* Search Toggle for Mobile */}
            <button
              onClick={() => setSearchOpen(true)}
              className="lg:hidden p-2.5 hover:bg-muted rounded-xl transition-all cursor-pointer group"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-foreground/70 group-hover:text-primary transition-colors" />
            </button>

            {/* Wishlist */}
            <Link
              href="/account/wishlist"
              className="hidden md:flex p-2.5 hover:bg-muted rounded-xl transition-all group"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5 text-foreground/70 group-hover:text-primary transition-colors" />
            </Link>

            {/* Cart with badge */}
            <Link
              href="/cart"
              className="relative p-2.5 hover:bg-muted rounded-xl transition-all group"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5 text-foreground/70 group-hover:text-primary transition-colors" />
              {mounted && count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-cognac text-cream text-[9px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>

            {/* Notification Center */}
            <NotificationCenter />

            {/* User / Sign In */}
            {mounted && session ? (
              <Link
                href={accountLink}
                className="ml-1 inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-bold uppercase shadow-sm shrink-0 transition-all overflow-hidden"
                title={`Account: ${session.user?.name || "User"}`}
              >
                {!avatarError && session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={32}
                    height={32}
                    className="h-full w-full rounded-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span>
                    {session.user?.name
                      ? session.user.name
                        .split(" ")
                        .map((n: any) => n[0])
                        .join("")
                        .slice(0, 2)
                      : "U"}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden lg:inline-flex items-center gap-1.5 px-4 py-1.5 border border-border/60 rounded-full hover:bg-muted text-xs font-bold tracking-wide uppercase transition-all ml-1"
              >
                <User className="h-3.5 w-3.5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <NavDrawer
            onClose={() => setMenuOpen(false)}
            categoriesList={categoriesList}
            session={session}
            accountLink={accountLink}
          />
        )}
      </AnimatePresence>

      {/* Global Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <SearchModal onClose={() => setSearchOpen(false)} categoriesList={categoriesList} />
        )}
      </AnimatePresence>
    </>
  );
}
