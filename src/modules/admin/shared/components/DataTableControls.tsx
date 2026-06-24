"use client";

import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

function TableSearchInner({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  // Debounced search logic
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      params.set("page", "1"); // reset page on new search
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, pathname, router, searchParams]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>
  );
}

import { Suspense } from "react";
export function TableSearch(props: { placeholder?: string }) {
  return (
    <Suspense
      fallback={<div className="w-full max-w-sm h-9 bg-muted animate-pulse rounded-lg"></div>}
    >
      <TableSearchInner {...props} />
    </Suspense>
  );
}

function TablePaginationInner({
  totalItems,
  itemsPerPage = 10,
}: {
  totalItems: number;
  itemsPerPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (totalItems <= itemsPerPage) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card rounded-b-xl">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
        </span>{" "}
        to{" "}
        <span className="font-medium text-foreground">
          {Math.min(currentPage * itemsPerPage, totalItems)}
        </span>{" "}
        of <span className="font-medium text-foreground">{totalItems}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm px-3 font-medium">
          {currentPage} / {totalPages}
        </div>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function TablePagination(props: { totalItems: number; itemsPerPage?: number }) {
  return (
    <Suspense fallback={<div className="h-12 border-t border-border bg-card rounded-b-xl"></div>}>
      <TablePaginationInner {...props} />
    </Suspense>
  );
}

function TableFilterInner({
  filterKey,
  options,
  defaultLabel = "All",
}: {
  filterKey: string;
  options: { label: string; value: string }[];
  defaultLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentValue = searchParams.get(filterKey) || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set(filterKey, val);
    } else {
      params.delete(filterKey);
    }
    params.set("page", "1"); // reset page
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="relative inline-flex items-center">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <select
        value={currentValue}
        onChange={handleChange}
        className="appearance-none pl-8 pr-8 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer"
      >
        <option value="">{defaultLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="h-4 w-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

export function TableFilter(props: {
  filterKey: string;
  options: { label: string; value: string }[];
  defaultLabel?: string;
}) {
  return (
    <Suspense fallback={<div className="h-9 w-32 bg-muted animate-pulse rounded-lg"></div>}>
      <TableFilterInner {...props} />
    </Suspense>
  );
}
