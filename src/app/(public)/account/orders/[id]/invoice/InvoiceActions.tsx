"use client";

import React from "react";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function InvoiceActions({ backUrl = "/account/orders" }: { backUrl?: string }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="no-print fixed bottom-6 right-6 flex items-center gap-3 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-elevated border border-border/60 z-50">
      <Link
        href={backUrl}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white hover:bg-neutral-50 text-xs font-bold text-charcoal transition-all shadow-xs"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer border-0"
      >
        <Printer className="h-4 w-4" />
        Print / Save PDF
      </button>
    </div>
  );
}
