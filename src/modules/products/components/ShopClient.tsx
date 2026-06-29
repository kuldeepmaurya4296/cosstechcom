"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, ChevronDown, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { RecentlyViewed } from "@/components/public/RecentlyViewed";
import { FilterSidebar } from "./FilterSidebar";
import { ActiveFilters } from "./ActiveFilters";
import { ProductGrid } from "./ProductGrid";

interface ShopClientProps {
  categories: any[];
  initialProducts: any[];
  totalProducts: number;
  filterMetadata: {
    brands: string[];
    sizes: any[];
    occasions: string[];
    colors: { name: string; hex: string }[];
    genders: string[];
    maxPrice: number;
    vendors?: { id: string; name: string }[];
  };
}

export default function ShopClient({
  categories,
  initialProducts,
  totalProducts,
  filterMetadata,
}: ShopClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Scroll handler and arrow visibility states for categories row
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    // Initial check after render to ensure correct state when products/categories load
    const timer = setTimeout(checkScroll, 300);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timer);
    };
  }, [categories]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 250;
    el.scrollTo({
      left: el.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount),
      behavior: "smooth",
    });
  };

  // Filter Drawer State
  const [filterOpen, setFilterOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset loadingState when initialProducts updates
  useEffect(() => {
    setLoadingMore(false);
  }, [initialProducts]);

  // URL Filter Parameters
  const activeCategory = searchParams.get("category") || "all";
  const activeBrand = searchParams.get("brand") || "";
  const activeOccasion = searchParams.get("occasion") || "";
  const activeSearch = searchParams.get("search") || "";
  const activeSort = (searchParams.get("sort") || "new") as "new" | "low" | "high" | "rating";
  const activeMinPrice = searchParams.get("minPrice") || "";
  const activeMaxPrice = searchParams.get("maxPrice") || "";
  const activeSize = searchParams.get("size") || "";
  const activeLimit = parseInt(searchParams.get("limit") || "8", 10);
  const activeGender = searchParams.get("gender") || "";
  const activeColor = searchParams.get("color") || "";
  
  // New Marketplace Filters
  const activeVendor = searchParams.get("vendor") || "";
  const activeDiscount = searchParams.get("discount") || "";
  const activeAvailability = searchParams.get("availability") || "";

  // Parse comma-separated lists
  const activeBrands = useMemo(() => {
    return activeBrand
      ? activeBrand
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean)
      : [];
  }, [activeBrand]);

  const activeSizes = useMemo(() => {
    return activeSize
      ? activeSize
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  }, [activeSize]);

  const activeGenders = useMemo(() => {
    return activeGender
      ? activeGender
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean)
      : [];
  }, [activeGender]);

  const activeColors = useMemo(() => {
    return activeColor
      ? activeColor
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];
  }, [activeColor]);

  const activeVendors = useMemo(() => {
    return activeVendor
      ? activeVendor
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];
  }, [activeVendor]);

  // Filter for Level 1 categories
  const level1Categories = useMemo(() => {
    return categories.filter((c) => c.level === 1 || !c.parentId);
  }, [categories]);

  // Check if a category is selected (including if a subcategory of it is selected)
  const isCategorySelected = (slug: string) => {
    return activeCategory === slug || activeCategory.startsWith(slug + "-");
  };

  // Local state for price inputs
  const [minInput, setMinInput] = useState(activeMinPrice);
  const [maxInput, setMaxInput] = useState(activeMaxPrice);

  // Sync inputs when URL changes
  useEffect(() => {
    setMinInput(activeMinPrice);
  }, [activeMinPrice]);

  useEffect(() => {
    setMaxInput(activeMaxPrice);
  }, [activeMaxPrice]);

  const updateFilters = (
    newParams: Record<string, string | null>,
    options?: { scroll?: boolean }
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset limit if we are changing other filters
    if (!("limit" in newParams)) {
      params.delete("limit");
    }

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    router.push(`/shop?${params.toString()}`, { scroll: options?.scroll ?? true });
  };

  const handleToggleBrand = (b: string) => {
    const isSelected = activeBrands.some((ab) => ab.toLowerCase() === b.toLowerCase());
    let newBrands;
    if (isSelected) {
      newBrands = activeBrands.filter((ab) => ab.toLowerCase() !== b.toLowerCase());
    } else {
      newBrands = [...activeBrands, b];
    }
    updateFilters({ brand: newBrands.length > 0 ? newBrands.join(",") : null });
  };

  const handleToggleSize = (sStr: string) => {
    const isSelected = activeSizes.includes(sStr);
    let newSizes;
    if (isSelected) {
      newSizes = activeSizes.filter((x) => x !== sStr);
    } else {
      newSizes = [...activeSizes, sStr];
    }
    updateFilters({ size: newSizes.length > 0 ? newSizes.join(",") : null });
  };

  const handleToggleGender = (g: string) => {
    const isSelected = activeGenders.some((ag) => ag.toLowerCase() === g.toLowerCase());
    let newGenders;
    if (isSelected) {
      newGenders = activeGenders.filter((ag) => ag.toLowerCase() !== g.toLowerCase());
    } else {
      newGenders = [...activeGenders, g];
    }
    updateFilters({ gender: newGenders.length > 0 ? newGenders.join(",") : null });
  };

  const handleToggleColor = (c: string) => {
    const isSelected = activeColors.some((ac) => ac.toLowerCase() === c.toLowerCase());
    let newColors;
    if (isSelected) {
      newColors = activeColors.filter((ac) => ac.toLowerCase() !== c.toLowerCase());
    } else {
      newColors = [...activeColors, c];
    }
    updateFilters({ color: newColors.length > 0 ? newColors.join(",") : null });
  };

  const handleToggleVendor = (vId: string) => {
    const isSelected = activeVendors.includes(vId);
    let newVendors;
    if (isSelected) {
      newVendors = activeVendors.filter((id) => id !== vId);
    } else {
      newVendors = [...activeVendors, vId];
    }
    updateFilters({ vendor: newVendors.length > 0 ? newVendors.join(",") : null });
  };

  const handleToggleOccasion = (o: string) => {
    const isSelected = activeOccasion.toLowerCase() === o.toLowerCase();
    updateFilters({ occasion: isSelected ? null : o });
  };

  const handleRemoveFilter = (key: string, value?: string) => {
    if (key === "category") {
      updateFilters({ category: "all" });
    } else if (key === "brand") {
      const remaining = activeBrands.filter((b) => b !== value);
      updateFilters({ brand: remaining.length > 0 ? remaining.join(",") : null });
    } else if (key === "size") {
      const remaining = activeSizes.filter((s) => s !== value);
      updateFilters({ size: remaining.length > 0 ? remaining.join(",") : null });
    } else if (key === "gender") {
      const remaining = activeGenders.filter((g) => g !== value);
      updateFilters({ gender: remaining.length > 0 ? remaining.join(",") : null });
    } else if (key === "color") {
      const remaining = activeColors.filter((c) => c !== value);
      updateFilters({ color: remaining.length > 0 ? remaining.join(",") : null });
    } else if (key === "vendor") {
      const remaining = activeVendors.filter((v) => v !== value);
      updateFilters({ vendor: remaining.length > 0 ? remaining.join(",") : null });
    } else if (key === "discount") {
      updateFilters({ discount: null });
    } else if (key === "availability") {
      updateFilters({ availability: null });
    } else if (key === "occasion") {
      updateFilters({ occasion: null });
    } else if (key === "search") {
      updateFilters({ search: null });
    } else if (key === "minPrice") {
      updateFilters({ minPrice: null });
      setMinInput("");
    } else if (key === "maxPrice") {
      updateFilters({ maxPrice: null });
      setMaxInput("");
    }
  };

  const handleClearAll = () => {
    setMinInput("");
    setMaxInput("");
    router.push("/shop");
  };

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      minPrice: minInput.trim() || null,
      maxPrice: maxInput.trim() || null,
    });
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    updateFilters(
      {
        limit: String(activeLimit + 8),
      },
      { scroll: false }
    );
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeCategory !== "all") count++;
    count += activeBrands.length;
    if (activeOccasion) count++;
    if (activeSearch) count++;
    if (activeMinPrice) count++;
    if (activeMaxPrice) count++;
    count += activeSizes.length;
    count += activeGenders.length;
    count += activeColors.length;
    count += activeVendors.length;
    if (activeDiscount) count++;
    if (activeAvailability === "in_stock") count++;
    return count;
  }, [
    activeCategory,
    activeBrands,
    activeOccasion,
    activeSearch,
    activeMinPrice,
    activeMaxPrice,
    activeSizes,
    activeGenders,
    activeColors,
    activeVendors,
    activeDiscount,
    activeAvailability,
  ]);

  const vendorsList = filterMetadata.vendors || [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
      {/* Breadcrumb Navigation */}
      <div className="text-xs text-muted-foreground mb-8 flex gap-2 items-center bg-cream/40 backdrop-blur-xs py-2 px-4 rounded-full border border-border/40 w-fit shadow-xs">
        <Link href="/" className="hover:text-cognac transition-colors flex items-center gap-1">
          <span>Home</span>
        </Link>
        <span className="text-muted-foreground/50">/</span>
        {activeCategory === "all" ? (
          <span className="text-charcoal font-semibold">Shop</span>
        ) : (
          <>
            <Link href="/shop" className="hover:text-cognac transition-colors">
              Shop
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-charcoal font-semibold capitalize">
              {categories.find((c) => c.slug === activeCategory)?.name || activeCategory}
            </span>
          </>
        )}
      </div>

      {/* Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 pb-8 border-b border-border/40">
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-[0.35em] text-cognac font-extrabold mb-1.5">
            The Collection
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-charcoal">
            Shop All Products
          </h1>
          <p className="text-muted-foreground text-sm mt-3 max-w-2xl leading-relaxed">
            Explore premium products from verified multi-vendor brands across India. Compare
            prices, designs, and specifications in our open marketplace.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-muted/20 py-2.5 px-5 rounded-2xl border border-border/40 w-fit shrink-0 self-start md:self-center">
          <div className="text-right">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Total Products
            </span>
            <span className="text-xl font-serif font-extrabold text-charcoal">{totalProducts}</span>
          </div>
          <div className="h-6 w-px bg-border/80" />
          <div className="text-right">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Showing
            </span>
            <span className="text-xl font-serif font-extrabold text-cognac">
              {initialProducts.length}
            </span>
          </div>
        </div>
      </div>

      {/* Active Filters tags */}
      <ActiveFilters
        categories={categories}
        activeCategory={activeCategory}
        activeBrands={activeBrands}
        activeOccasion={activeOccasion}
        activeSearch={activeSearch}
        activeMinPrice={activeMinPrice}
        activeMaxPrice={activeMaxPrice}
        activeSizes={activeSizes}
        activeGenders={activeGenders}
        activeColors={activeColors}
        activeVendors={activeVendors}
        activeDiscount={activeDiscount}
        activeAvailability={activeAvailability}
        vendors={vendorsList}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
      />

      {/* Main Filter & Sort Controls Grid */}
      <div className="sticky top-16 md:top-20 z-20 -mx-4 md:mx-0 px-4 md:px-3 py-3.5 bg-cream/80 backdrop-blur-md border-y border-border/80 md:border md:rounded-2xl md:bg-card/90 md:p-5 md:shadow-lg mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 transition-all duration-300">
        {/* Categories scrollable wrapper with relative navigation arrows */}
        <div className="relative flex-1 min-w-0 w-full flex items-center group">
          {canScrollLeft && (
            <button
              onClick={() => handleScroll("left")}
              className="absolute left-0 z-10 bg-card/90 hover:bg-card border border-border/80 rounded-full h-8 w-8 flex items-center justify-center shadow-md hover:shadow-lg text-charcoal hover:text-cognac transition cursor-pointer"
              aria-label="Scroll categories left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Categories scrollable container */}
          <div
            ref={scrollRef}
            className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide pb-2 lg:pb-0 px-1 sm:px-0 w-full min-w-0"
          >
            <button
              onClick={() => updateFilters({ category: "all" })}
              className={`px-4.5 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-300 shadow-xs ${
                activeCategory === "all"
                  ? "bg-charcoal text-cream shadow-md scale-102"
                  : "bg-cream/60 text-muted-foreground hover:bg-cream hover:text-charcoal border border-border/50"
              }`}
            >
              All Styles
            </button>
            {level1Categories.map((c) => {
              const isSelected = isCategorySelected(c.slug);
              return (
                <button
                  key={c.id || c._id}
                  onClick={() => updateFilters({ category: c.slug })}
                  className={`px-4.5 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-300 shadow-xs ${
                    isSelected
                      ? "bg-charcoal text-cream shadow-md scale-102"
                      : "bg-cream/60 text-muted-foreground hover:bg-cream hover:text-charcoal border border-border/50"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          {canScrollRight && (
            <button
              onClick={() => handleScroll("right")}
              className="absolute right-0 z-10 bg-card/90 hover:bg-card border border-border/80 rounded-full h-8 w-8 flex items-center justify-center shadow-md hover:shadow-lg text-charcoal hover:text-cognac transition cursor-pointer"
              aria-label="Scroll categories right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort & Filter Drawer toggle */}
        <div className="flex items-center justify-between lg:justify-end gap-4 text-sm px-1 sm:px-0 border-t border-border/30 pt-3 lg:border-0 lg:pt-0 shrink-0">
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 bg-cream/80 hover:bg-cream border border-border/80 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer hover:shadow-sm hover:border-brass/50 transition duration-200"
          >
            <SlidersHorizontal className="h-4 w-4 text-cognac" />
            <span className="text-charcoal">Filter Options</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-cognac text-cream text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-extrabold animate-pulse">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Sort By:</span>
            <div className="relative">
              <select
                value={activeSort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="appearance-none bg-cream/85 border border-border/85 rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold text-charcoal outline-none cursor-pointer focus:border-brass/60 focus:ring-1 focus:ring-brass/30 transition-all duration-200"
              >
                <option value="new">Newest Arrivals</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <ProductGrid
        products={initialProducts}
        totalProducts={totalProducts}
        loadingMore={loadingMore}
        onLoadMore={handleLoadMore}
        onClearAll={handleClearAll}
      />

      {/* Filter Side Drawer Panel */}
      <FilterSidebar
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories}
        activeCategory={activeCategory}
        onToggleCategory={(slug) => updateFilters({ category: activeCategory === slug ? "all" : slug })}
        filterMetadata={filterMetadata}
        activeBrands={activeBrands}
        onToggleBrand={handleToggleBrand}
        activeSizes={activeSizes}
        onToggleSize={handleToggleSize}
        activeGenders={activeGenders}
        onToggleGender={handleToggleGender}
        activeColors={activeColors}
        onToggleColor={handleToggleColor}
        activeOccasion={activeOccasion}
        onToggleOccasion={handleToggleOccasion}
        minInput={minInput}
        setMinInput={setMinInput}
        maxInput={maxInput}
        setMaxInput={setMaxInput}
        onApplyPrice={handleApplyPrice}
        onClearAll={handleClearAll}
        activeVendors={activeVendors}
        onToggleVendor={handleToggleVendor}
        activeDiscount={activeDiscount}
        onChangeDiscount={(val) => updateFilters({ discount: val || null })}
        activeAvailability={activeAvailability}
        onChangeAvailability={(val) => updateFilters({ availability: val || null })}
      />

      <RecentlyViewed />
    </div>
  );
}
