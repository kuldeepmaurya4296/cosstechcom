"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

export function Watermark() {
  return (
    <div className="fixed bottom-24 md:bottom-20 left-6 z-[999] print:hidden">
      {/* <a
        href="https://maurya-tech.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cream/70 backdrop-blur-md border border-border/50 shadow-sm text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground hover:text-cognac dark:hover:text-brass hover:border-cognac/35 dark:hover:border-brass/35 transition-all duration-300 opacity-40 hover:opacity-100 hover:scale-102 cursor-pointer select-none"
        title="Maurya Technologies & Services"
      >
        <span>Built by Maurya Tech</span>
        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
      </a> */}
    </div>
  );
}
