"use client";

import React, { useState } from "react";
import { SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AccordionItemProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionItem({ title, isOpen, onToggle, children }: AccordionItemProps) {
  return (
    <div className="border-b border-border/40 py-3 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 text-left font-serif font-bold text-sm tracking-wide text-charcoal cursor-pointer hover:text-cognac transition-colors outline-none"
      >
        <span>{title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-brass" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden mt-2"
          >
            <div className="pb-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  activeCategory: string;
  onToggleCategory: (slug: string) => void;
  filterMetadata: {
    brands: string[];
    sizes: any[];
    occasions: string[];
    colors: { name: string; hex: string }[];
    genders: string[];
    maxPrice: number;
    vendors?: { id: string; name: string }[];
  };
  activeBrands: string[];
  onToggleBrand: (brand: string) => void;
  activeSizes: string[];
  onToggleSize: (size: string) => void;
  activeGenders: string[];
  onToggleGender: (gender: string) => void;
  activeColors: string[];
  onToggleColor: (color: string) => void;
  activeOccasion: string;
  onToggleOccasion: (occasion: string) => void;
  minInput: string;
  setMinInput: (val: string) => void;
  maxInput: string;
  setMaxInput: (val: string) => void;
  onApplyPrice: (e: React.FormEvent) => void;
  onClearAll: () => void;
  activeVendors: string[];
  onToggleVendor: (vendorId: string) => void;
  activeDiscount: string;
  onChangeDiscount: (val: string) => void;
  activeAvailability: string;
  onChangeAvailability: (val: string) => void;
}

export function FilterSidebar({
  isOpen,
  onClose,
  categories,
  activeCategory,
  onToggleCategory,
  filterMetadata,
  activeBrands,
  onToggleBrand,
  activeSizes,
  onToggleSize,
  activeGenders,
  onToggleGender,
  activeColors,
  onToggleColor,
  activeOccasion,
  onToggleOccasion,
  minInput,
  setMinInput,
  maxInput,
  setMaxInput,
  onApplyPrice,
  onClearAll,
  activeVendors,
  onToggleVendor,
  activeDiscount,
  onChangeDiscount,
  activeAvailability,
  onChangeAvailability,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    brand: true,
    size: true,
    price: false,
    occasion: false,
    color: false,
    gender: false,
    category: false,
    vendor: false,
    discount: false,
    availability: false,
  });

  const level1Categories = React.useMemo(() => {
    return categories.filter((c) => c.level === 1 || !c.parentId);
  }, [categories]);

  const isCategorySelected = (slug: string) => {
    return activeCategory === slug || activeCategory.startsWith(slug + "-");
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const discountOptions = [
    { label: "10% and above", value: "10" },
    { label: "20% and above", value: "20" },
    { label: "30% and above", value: "30" },
    { label: "40% and above", value: "40" },
    { label: "50% and above", value: "50" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-40"
          />

          {/* Side Drawer menu */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 h-full w-[85vw] max-w-[340px] bg-cream/95 backdrop-blur-md border-r border-border/80 shadow-2xl z-50 flex flex-col p-6 overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
              <span className="font-serif font-bold text-lg text-charcoal flex items-center gap-2">
                <SlidersHorizontal className="h-4.5 w-4.5 text-cognac" />
                <span>Filter Catalog</span>
              </span>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-muted/80 rounded-full transition cursor-pointer"
                aria-label="Close filters"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Drawer Sections - Accordion System */}
            <div className="flex-grow overflow-y-auto pr-1 scrollbar-thin space-y-1">
              {/* Category Accordion */}
              <AccordionItem
                title="Category"
                isOpen={expandedSections.category}
                onToggle={() => toggleSection("category")}
              >
                <div className="flex flex-col gap-1.5">
                  {level1Categories.map((c) => {
                    const isSelected = isCategorySelected(c.slug);
                    return (
                      <button
                        key={c.id || c._id}
                        onClick={() => onToggleCategory(c.slug)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? "bg-cognac/5 border-cognac/40 text-cognac"
                            : "border-border/60 hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        <span>{c.name}</span>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-cognac" />}
                      </button>
                    );
                  })}
                </div>
              </AccordionItem>

              {/* Availability Accordion */}
              <AccordionItem
                title="Availability"
                isOpen={expandedSections.availability}
                onToggle={() => toggleSection("availability")}
              >
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => onChangeAvailability("")}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                      activeAvailability !== "in_stock"
                        ? "bg-cognac/5 border-cognac/40 text-cognac"
                        : "border-border/60 hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <span>All Items</span>
                    {activeAvailability !== "in_stock" && <div className="h-1.5 w-1.5 rounded-full bg-cognac" />}
                  </button>
                  <button
                    onClick={() => onChangeAvailability("in_stock")}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                      activeAvailability === "in_stock"
                        ? "bg-cognac/5 border-cognac/40 text-cognac"
                        : "border-border/60 hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <span>In Stock Only</span>
                    {activeAvailability === "in_stock" && <div className="h-1.5 w-1.5 rounded-full bg-cognac" />}
                  </button>
                </div>
              </AccordionItem>

              {/* Gender Accordion */}
              {filterMetadata.genders.length > 0 && (
                <AccordionItem
                  title="Gender"
                  isOpen={expandedSections.gender}
                  onToggle={() => toggleSection("gender")}
                >
                  <div className="flex flex-col gap-1.5">
                    {filterMetadata.genders.map((g) => {
                      const isSelected = activeGenders.some(
                        (ag) => ag.toLowerCase() === g.toLowerCase()
                      );
                      return (
                        <button
                          key={g}
                          onClick={() => onToggleGender(g)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? "bg-cognac/5 border-cognac/40 text-cognac"
                              : "border-border/60 hover:bg-muted/60 text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="h-4 w-4 rounded border-border text-cognac focus:ring-cognac cursor-pointer accent-cognac"
                            />
                            <span>{g}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </AccordionItem>
              )}

              {/* Brand Accordion */}
              {filterMetadata.brands.length > 0 && (
                <AccordionItem
                  title="Brand"
                  isOpen={expandedSections.brand}
                  onToggle={() => toggleSection("brand")}
                >
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {filterMetadata.brands.map((b) => {
                      const isSelected = activeBrands.some(
                        (ab) => ab.toLowerCase() === b.toLowerCase()
                      );
                      return (
                        <button
                          key={b}
                          onClick={() => onToggleBrand(b)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? "bg-cognac/5 border-cognac/40 text-cognac"
                              : "border-border/60 hover:bg-muted/60 text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="h-4 w-4 rounded border-border text-cognac focus:ring-cognac cursor-pointer accent-cognac"
                            />
                            <span>{b}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </AccordionItem>
              )}

              {/* Vendor Accordion */}
              {filterMetadata.vendors && filterMetadata.vendors.length > 0 && (
                <AccordionItem
                  title="Seller / Vendor"
                  isOpen={expandedSections.vendor}
                  onToggle={() => toggleSection("vendor")}
                >
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {filterMetadata.vendors.map((v) => {
                      const isSelected = activeVendors.includes(v.id);
                      return (
                        <button
                          key={v.id}
                          onClick={() => onToggleVendor(v.id)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? "bg-cognac/5 border-cognac/40 text-cognac"
                              : "border-border/60 hover:bg-muted/60 text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="h-4 w-4 rounded border-border text-cognac focus:ring-cognac cursor-pointer accent-cognac"
                            />
                            <span>{v.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </AccordionItem>
              )}

              {/* Size Accordion */}
              {filterMetadata.sizes.length > 0 && (
                <AccordionItem
                  title="Select Size"
                  isOpen={expandedSections.size}
                  onToggle={() => toggleSection("size")}
                >
                  <div className="grid grid-cols-4 gap-1.5">
                    {filterMetadata.sizes.map((s) => {
                      const sStr = String(s);
                      const isSelected = activeSizes.includes(sStr);
                      return (
                        <button
                          key={s}
                          onClick={() => onToggleSize(sStr)}
                          className={`py-2 border text-xs font-bold rounded-xl transition cursor-pointer ${
                            isSelected
                              ? "bg-cognac text-cream border-cognac shadow-xs"
                              : "border-border/80 hover:border-brass/50 text-foreground bg-cream/40"
                          }`}
                        >
                          UK {s}
                        </button>
                      );
                    })}
                  </div>
                </AccordionItem>
              )}

              {/* Color Accordion */}
              {filterMetadata.colors.length > 0 && (
                <AccordionItem
                  title="Color"
                  isOpen={expandedSections.color}
                  onToggle={() => toggleSection("color")}
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    {filterMetadata.colors.map((c) => {
                      const isSelected = activeColors.some(
                        (ac) => ac.toLowerCase() === c.name.toLowerCase()
                      );
                      return (
                        <button
                          key={c.name}
                          onClick={() => onToggleColor(c.name)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? "bg-cognac/5 border-cognac/40 text-cognac"
                              : "border-border/60 hover:bg-muted/60 text-foreground"
                          }`}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-black/15 shadow-sm shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </AccordionItem>
              )}

              {/* Discount Accordion */}
              <AccordionItem
                title="Discounts"
                isOpen={expandedSections.discount}
                onToggle={() => toggleSection("discount")}
              >
                <div className="flex flex-col gap-1.5">
                  {discountOptions.map((opt) => {
                    const isSelected = activeDiscount === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => onChangeDiscount(isSelected ? "" : opt.value)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? "bg-cognac/5 border-cognac/40 text-cognac"
                            : "border-border/60 hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-cognac" />}
                      </button>
                    );
                  })}
                </div>
              </AccordionItem>

              {/* Occasion Accordion */}
              {filterMetadata.occasions.length > 0 && (
                <AccordionItem
                  title="Occasion"
                  isOpen={expandedSections.occasion}
                  onToggle={() => toggleSection("occasion")}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {filterMetadata.occasions.map((o) => {
                      const isSelected = activeOccasion.toLowerCase() === o.toLowerCase();
                      return (
                        <button
                          key={o}
                          onClick={() => onToggleOccasion(o)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border cursor-pointer ${
                            isSelected
                              ? "bg-cognac text-cream border-cognac shadow-xs"
                              : "border-border/80 hover:bg-muted text-muted-foreground bg-cream/40"
                          }`}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </AccordionItem>
              )}

              {/* Price Range Accordion */}
              <AccordionItem
                title="Price Range"
                isOpen={expandedSections.price}
                onToggle={() => toggleSection("price")}
              >
                <form onSubmit={onApplyPrice} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minInput}
                        onChange={(e) => setMinInput(e.target.value)}
                        className="w-full pl-6 pr-2 py-2 bg-cream border border-border/80 rounded-xl text-xs outline-none focus:border-cognac transition"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">-</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder={`Max (${Math.ceil(filterMetadata.maxPrice)})`}
                        value={maxInput}
                        onChange={(e) => setMaxInput(e.target.value)}
                        className="w-full pl-6 pr-2 py-2 bg-cream border border-border/80 rounded-xl text-xs outline-none focus:border-cognac transition"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-cognac/10 text-cognac text-xs font-bold rounded-xl hover:bg-cognac hover:text-cream transition cursor-pointer"
                  >
                    Apply Price
                  </button>
                </form>
              </AccordionItem>
            </div>

            {/* Bottom Actions - Sticky at bottom */}
            <div className="mt-4 border-t border-border/40 pt-4 flex gap-2.5 shrink-0 bg-cream/95">
              <button
                onClick={onClearAll}
                className="flex-1 py-3 border border-border rounded-full text-xs font-bold hover:bg-muted transition cursor-pointer text-charcoal"
              >
                Reset All
              </button>
              <button
                onClick={onClose}
                className="flex-grow py-3 bg-charcoal text-cream hover:bg-cognac rounded-full text-xs font-bold transition cursor-pointer shadow-md"
              >
                View Results
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
