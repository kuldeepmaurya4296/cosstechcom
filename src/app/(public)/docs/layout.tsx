"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, BookOpen, ChevronRight, FileText } from "lucide-react";
import { docsSections } from "@/data/docs-content";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Group sections by category
  const categories = [
    { id: "getting-started", label: "Getting Started" },
    { id: "customer-guide", label: "Customer Guides" },
    { id: "admin-guide", label: "Operator & Admin Guides" },
    { id: "technical-reference", label: "Technical Reference" },
    { id: "future-roadmap", label: "Future Integration" },
  ];

  const getActiveSlug = () => {
    const parts = pathname.split("/");
    return parts[parts.length - 1] || "introduction";
  };

  const activeSlug = getActiveSlug();

  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-4">
        <BookOpen className="h-5 w-5 text-cognac" />
        <span className="font-serif font-bold text-lg text-charcoal tracking-tight">
          System Manuals
        </span>
      </div>

      {/* Nav groups */}
      <nav className="space-y-5">
        {categories.map((cat) => {
          const catSections = docsSections.filter((s) => s.category === cat.id);
          if (catSections.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-1.5">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/60 block px-2.5">
                {cat.label}
              </span>
              <ul className="space-y-1">
                {catSections.map((sec) => {
                  const isActive =
                    activeSlug === sec.id || (activeSlug === "docs" && sec.id === "introduction");
                  const SecIcon = sec.icon || FileText;

                  return (
                    <li key={sec.id}>
                      <Link
                        href={`/docs/${sec.id}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          isActive
                            ? "bg-cognac/10 text-cognac dark:bg-brass/10 dark:text-brass"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <SecIcon
                            className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-cognac dark:text-brass" : "text-muted-foreground/75 group-hover:text-foreground"}`}
                          />
                          <span className="truncate max-w-[150px]">{sec.title}</span>
                        </div>
                        <ChevronRight
                          className={`h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "text-cognac dark:text-brass opacity-100" : "text-muted-foreground"}`}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream/10">
      {/* Mobile Top Bar */}
      <div className="lg:hidden border-b border-border/50 bg-card p-4 flex items-center justify-between sticky top-16 z-30">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4.5 w-4.5 text-cognac" />
          <span className="font-serif font-bold text-sm text-charcoal">
            System Documentation
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition cursor-pointer"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block bg-card border border-border/60 rounded-2xl p-5 sticky top-24 shadow-sm min-h-[500px]">
            <SidebarContent />
          </aside>

          {/* Main Content Area */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-10 shadow-sm min-h-[600px] animate-in fade-in duration-300">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-charcoal/40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Mobile drawer container */}
      <div
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-72 bg-card border-r border-border p-6 shadow-2xl transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cognac" />
            <span className="font-serif font-bold text-base text-charcoal">
              Documentation
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 hover:bg-muted rounded-full transition cursor-pointer"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[85vh] pr-2 scrollbar-thin">
          <SidebarContent />
        </div>
      </div>
    </div>
  );
}
