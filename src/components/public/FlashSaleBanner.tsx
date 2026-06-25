"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Timer, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/format";

export function FlashSaleBanner() {
  const [activeSale, setActiveSale] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetch("/api/flash-sales")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setActiveSale(data[0]); // Grab the first active flash sale
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeSale) return;

    const target = new Date(activeSale.endTime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setActiveSale(null); // Sale ended
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSale]);

  if (!activeSale) return null;

  return (
    <div className="bg-gradient-to-r from-red-700 via-red-600 to-amber-700 text-cream py-3 px-4 shadow-md text-center text-xs md:text-sm font-semibold tracking-wide relative overflow-hidden flex flex-col sm:flex-row items-center justify-center gap-3.5 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-1.5 justify-center z-10">
        <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
        <span className="font-serif uppercase font-black text-amber-200">
          ⚡ {activeSale.name}:
        </span>
        <span>
          Save up to{" "}
          <span className="underline font-black text-amber-200 decoration-amber-300">
            {activeSale.discountType === "PERCENTAGE"
              ? `${activeSale.discountValue}%`
              : formatINR(activeSale.discountValue)}
          </span>{" "}
          on selected items!
        </span>
      </div>

      <div className="flex items-center gap-2 justify-center z-10 font-mono bg-black/20 px-3.5 py-1 rounded-full border border-white/10">
        <Timer className="h-4 w-4 text-amber-300 shrink-0" />
        <span className="text-[11px] text-amber-100 font-bold uppercase tracking-wider">
          Ends In:
        </span>
        <span className="font-black text-white">{String(timeLeft.hours).padStart(2, "0")}h</span>
        <span>:</span>
        <span className="font-black text-white">{String(timeLeft.minutes).padStart(2, "0")}m</span>
        <span>:</span>
        <span className="font-black text-white">{String(timeLeft.seconds).padStart(2, "0")}s</span>
      </div>

      <Link
        href="/shop"
        className="flex items-center gap-1 text-[11px] bg-white text-red-700 hover:bg-amber-100 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all duration-300 shadow-xs z-10"
      >
        Shop Deals <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
