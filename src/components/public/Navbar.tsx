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
import { AnimatePresence, motion } from "framer-motion";
import { NotificationCenter } from "./NotificationCenter";

const SearchModal = dynamic(() => import("./SearchModal").then((mod) => mod.SearchModal), {
  ssr: false,
});

const NavDrawer = dynamic(() => import("./NavDrawer").then((mod) => mod.NavDrawer), { ssr: false });

const PROMOS: Record<
  string,
  {
    title: string;
    subtitle: string;
    bg: string;
    badge: string;
    buttonText: string;
    link: string;
  }
> = {
  fashion: {
    title: "Premium Apparel",
    subtitle: "Explore curated clothing, footwear, and accessories.",
    bg: "from-amber-500/10 via-accent/5 to-primary/10",
    badge: "New Season",
    buttonText: "Shop Collection",
    link: "/shop?category=fashion",
  },
  electronics: {
    title: "Next-Gen Tech",
    subtitle: "High-performance laptops, accessories, and smartphones.",
    bg: "from-blue-600/10 via-primary/5 to-cyan-600/10",
    badge: "Trending",
    buttonText: "Explore Tech",
    link: "/shop?category=electronics",
  },
  grocery: {
    title: "Fresh Harvest",
    subtitle: "Daily essentials, organic fruits, veggies, and pantry staples.",
    bg: "from-emerald-600/10 via-success/5 to-primary/10",
    badge: "Organic",
    buttonText: "Buy Fresh",
    link: "/shop?category=grocery",
  },
  "home-furniture": {
    title: "Cozy Spaces",
    subtitle: "Artisanal furniture, designer decor, and kitchen essentials.",
    bg: "from-orange-600/10 via-amber-500/5 to-primary/10",
    badge: "Handcrafted",
    buttonText: "Browse Decor",
    link: "/shop?category=home-furniture",
  },
  default: {
    title: "Exclusive Deals",
    subtitle: "Handpicked premium brands and verified seller products.",
    bg: "from-purple-600/10 via-brass/5 to-primary/10",
    badge: "Featured",
    buttonText: "Shop Deals",
    link: "/shop?discount=20",
  },
};

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
            ? "bg-background/95 backdrop-blur-xl shadow-md shadow-neutral-900/5 border-b border-border/60"
            : "bg-background/90 backdrop-blur-lg border-b border-border/40"
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
              className={`text-[11px] font-bold hover:text-primary transition-all uppercase tracking-[0.18em] pb-1.5 border-b-2 whitespace-nowrap ${path === "/shop" && !searchParams.get("category")
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground/60 hover:border-primary/60 hover:text-foreground"
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
                          className={`text-[11px] font-bold hover:text-primary transition-all uppercase tracking-[0.18em] flex items-center gap-1 cursor-pointer pb-1.5 border-b-2 whitespace-nowrap ${isActive
                              ? "border-primary text-primary"
                              : "border-transparent text-foreground/60 hover:border-primary/60 hover:text-foreground"
                            }`}
                        >
                          <span>{lvl1.name}</span>
                          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${activeMega === lvl1.id ? "rotate-180" : ""}`} />
                        </button>

                        {/* Mega Menu Dropdown */}
                        <AnimatePresence>
                          {activeMega === lvl1.id && lvl1.children && lvl1.children.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 15, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.98 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className="absolute top-full left-1/2 -translate-x-1/2 w-[680px] bg-card/98 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-6 z-50 grid grid-cols-3 gap-6 mt-2"
                            >
                              <div className="col-span-2 grid grid-cols-2 gap-6">
                                {lvl1.children.map((lvl2: any) => (
                                  <div key={lvl2.id} className="space-y-3">
                                    <Link
                                      href={`/shop?category=${lvl2.slug}`}
                                      className="font-serif font-bold text-xs tracking-wide text-foreground hover:text-primary transition-colors block border-b border-border/40 pb-1"
                                    >
                                      {lvl2.name}
                                    </Link>
                                    <ul className="space-y-1">
                                      {lvl2.children.map((lvl3: any) => (
                                        <li key={lvl3.id}>
                                          <Link
                                            href={`/shop?category=${lvl3.slug}`}
                                            className="group text-xs text-muted-foreground hover:text-primary flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-all duration-150 hover:translate-x-0.5"
                                          >
                                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30 group-hover:bg-primary/70 transition-colors shrink-0" />
                                            <span>{lvl3.name}</span>
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>

                              {/* Promo Card Block */}
                              {(() => {
                                const promo = PROMOS[lvl1.slug] || PROMOS.default;
                                return (
                                  <div className={`col-span-1 flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br ${promo.bg} border border-border/40 relative overflow-hidden group/promo`}>
                                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover/promo:scale-125 transition-transform duration-500" />
                                    <div className="space-y-2.5 relative z-10">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/15">
                                        {promo.badge}
                                      </span>
                                      <h4 className="font-serif text-sm font-bold text-foreground leading-tight">
                                        {promo.title}
                                      </h4>
                                      <p className="text-[10px] text-muted-foreground leading-normal">
                                        {promo.subtitle}
                                      </p>
                                    </div>
                                    <div className="relative z-10 pt-4">
                                      <Link
                                        href={promo.link}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-xl hover:opacity-95 transition-all shadow-sm group-hover/promo:gap-2"
                                      >
                                        <span>{promo.buttonText}</span>
                                        <ChevronRight className="h-3 w-3" />
                                      </Link>
                                    </div>
                                  </div>
                                );
                              })()}
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                        className={`text-[11px] font-bold hover:text-primary transition-all uppercase tracking-[0.18em] flex items-center gap-1 cursor-pointer pb-1.5 border-b-2 whitespace-nowrap border-transparent text-foreground/60 hover:border-primary/60 hover:text-foreground`}
                      >
                        <span>More</span>
                        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${activeMega === "more" ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {activeMega === "more" && (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="absolute top-full left-0 w-[240px] bg-card/98 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-3 z-50 flex flex-col gap-1 mt-2"
                          >
                            {otherCategories.map((lvl1) => (
                              <div
                                key={lvl1.id}
                                className="relative"
                                onMouseEnter={() => setActiveMoreSub(lvl1.id)}
                              >
                                <div
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    activeMoreSub === lvl1.id
                                      ? "bg-primary/5 text-primary"
                                      : "text-foreground/75 hover:bg-primary/5 hover:text-primary"
                                  }`}
                                >
                                  <Link href={`/shop?category=${lvl1.slug}`} className="flex-1">
                                    {lvl1.name}
                                  </Link>
                                  {lvl1.children && lvl1.children.length > 0 && (
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                                  )}
                                </div>

                                {/* Flyout Sub-menu */}
                                <AnimatePresence>
                                  {activeMoreSub === lvl1.id && lvl1.children && lvl1.children.length > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, x: 10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: 5 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute top-0 left-full ml-2 w-[480px] bg-card/98 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-5 z-50 grid grid-cols-2 gap-5"
                                    >
                                      {lvl1.children.map((lvl2: any) => (
                                        <div key={lvl2.id} className="space-y-2.5">
                                          <Link
                                            href={`/shop?category=${lvl2.slug}`}
                                            className="font-serif font-bold text-xs tracking-wide text-foreground hover:text-primary transition-colors block border-b border-border/40 pb-0.5"
                                          >
                                            {lvl2.name}
                                          </Link>
                                          <ul className="space-y-1">
                                            {lvl2.children.map((lvl3: any) => (
                                              <li key={lvl3.id}>
                                                <Link
                                                  href={`/shop?category=${lvl3.slug}`}
                                                  className="group text-xs text-muted-foreground hover:text-primary flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-primary/5 transition-all duration-150 hover:translate-x-0.5"
                                                >
                                                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30 group-hover:bg-primary/70 transition-colors shrink-0" />
                                                  <span>{lvl3.name}</span>
                                                </Link>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              );
            })()}
          </nav>

          {/* Inline Autocomplete Search (Desktop only) */}
          <div className="hidden lg:flex items-center gap-2.5 bg-muted/30 hover:bg-muted/50 focus-within:bg-background focus-within:ring-4 focus-within:ring-primary/5 border border-border/30 focus-within:border-primary/30 rounded-full px-4.5 py-2 max-w-[240px] xl:max-w-[320px] flex-1 relative transition-all duration-200 group">
            <Search className="h-4 w-4 text-muted-foreground/60 shrink-0 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search products, brands..."
              className="bg-transparent border-none outline-none text-xs w-full font-medium text-foreground placeholder:text-muted-foreground/50 focus:placeholder:text-muted-foreground/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setResultsVisible(true)}
              onBlur={() => setTimeout(() => setResultsVisible(false), 200)}
            />
            <AnimatePresence>
              {resultsVisible && searchQuery && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 bg-card/98 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-3 z-50 max-h-[300px] overflow-y-auto mt-2.5 space-y-2"
                >
                  {searchResults.slice(0, 5).map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/shop/${p.slug}`}
                      className="flex items-center gap-3 hover:bg-primary/5 p-2 rounded-xl transition-all duration-150 group/item"
                    >
                      <img
                        src={p.image || "/assets/product-placeholder.jpg"}
                        className="h-9 w-9 object-cover rounded-lg border border-border/50 shrink-0 group-hover/item:border-primary/20"
                        alt=""
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold truncate text-foreground leading-snug group-hover/item:text-primary transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[9px] text-muted-foreground/80 mt-0.5">
                          {p.brand} · {formatINR(p.price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
