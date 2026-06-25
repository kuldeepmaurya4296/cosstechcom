"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SizeSelectorProps {
  sizes: (string | number)[];
  selectedSize: string | number | null;
  onSelect: (size: string | number) => void;
  availableSizes?: (string | number)[];
  label?: string;
  showSizeGuide?: boolean;
}

export function SizeSelector({
  sizes,
  selectedSize,
  onSelect,
  availableSizes = [],
  label = "Size (UK/IND)",
  showSizeGuide = true,
}: SizeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chart" | "measure">("chart");

  const sizeChartData = [
    { uk: 5, usMen: 6, usWomen: 7.5, eu: 38, lengthIn: '9.3"', lengthCm: 23.7 },
    { uk: 6, usMen: 7, usWomen: 8.5, eu: "39-40", lengthIn: '9.7"', lengthCm: 24.6 },
    { uk: 7, usMen: 8, usWomen: 9.5, eu: 41, lengthIn: '10.0"', lengthCm: 25.4 },
    { uk: 8, usMen: 9, usWomen: 10.5, eu: 42, lengthIn: '10.3"', lengthCm: 26.2 },
    { uk: 9, usMen: 10, usWomen: 11.5, eu: "43-44", lengthIn: '10.7"', lengthCm: 27.1 },
    { uk: 10, usMen: 11, usWomen: 12.5, eu: 45, lengthIn: '11.0"', lengthCm: 27.9 },
    { uk: 11, usMen: 12, usWomen: 13.5, eu: 46, lengthIn: '11.3"', lengthCm: 28.7 },
    { uk: 12, usMen: 13, usWomen: 14.5, eu: 47, lengthIn: '11.7"', lengthCm: 29.6 },
  ];

  return (
    <div>
      <div className="flex justify-between mb-2">
        <p className="text-sm font-semibold">{label}</p>
        {showSizeGuide && (
          <button
            onClick={() => setIsOpen(true)}
            className="text-xs underline hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0 outline-none"
          >
            Size guide
          </button>
        )}
      </div>
      <div className="grid grid-cols-6 gap-2">
        {sizes.map((s) => {
          const isAvailable = availableSizes.length === 0 || availableSizes.includes(s);
          const isSelected = selectedSize === s;
          return (
            <button
              key={s}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelect(s)}
              className={`h-12 rounded-lg border-2 text-sm font-semibold transition relative cursor-pointer disabled:cursor-not-allowed ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : isAvailable
                    ? "border-border hover:border-charcoal bg-background"
                    : "border-border/40 text-muted-foreground bg-muted/20 opacity-40 line-through"
              }`}
            >
              {s}
              {!isAvailable && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="w-[80%] h-[1.5px] bg-muted-foreground/30 rotate-45 transform origin-center" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Size Guide Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-charcoal/50 z-[9999] backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-x-4 bottom-4 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl w-auto max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl z-[99999] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                <h3 className="font-serif text-lg font-bold text-charcoal">Size Guide</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-muted rounded-full transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Tabs Bar */}
              <div className="flex border-b border-border bg-muted/30">
                <button
                  onClick={() => setActiveTab("chart")}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 outline-none ${
                    activeTab === "chart"
                      ? "border-primary text-primary bg-background"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Size Conversion Chart
                </button>
                <button
                  onClick={() => setActiveTab("measure")}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 outline-none ${
                    activeTab === "measure"
                      ? "border-primary text-primary bg-background"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  How to Measure
                </button>
              </div>

              {/* Modal Body / Scrollable */}
              <div className="p-6 overflow-y-auto flex-1 min-h-[300px]">
                {activeTab === "chart" ? (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground font-medium">
                      All products on CosstechCom follow standard sizing conventions.
                      Use this table to convert your sizing to US or European formats.
                    </p>

                    {/* Table wrapper for mobile scrolling */}
                    <div className="overflow-x-auto border border-border rounded-xl shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-muted/80 text-muted-foreground uppercase font-bold border-b border-border">
                            <th className="px-4 py-3 font-bold text-charcoal">UK / IND</th>
                            <th className="px-4 py-3">US Men</th>
                            <th className="px-4 py-3">US Women</th>
                            <th className="px-4 py-3">EU</th>
                            <th className="px-4 py-3">Foot Length (in)</th>
                            <th className="px-4 py-3 text-right">Foot Length (cm)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {sizeChartData.map((row) => (
                            <tr
                              key={row.uk}
                              className={`hover:bg-muted/30 transition-colors ${
                                selectedSize !== null && String(selectedSize) === String(row.uk)
                                  ? "bg-primary/5 font-bold text-primary"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <td className="px-4 py-3 font-bold text-charcoal flex items-center gap-1.5">
                                {row.uk}
                                {selectedSize !== null && String(selectedSize) === String(row.uk) && (
                                  <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                                    Selected
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">{row.usMen}</td>
                              <td className="px-4 py-3">{row.usWomen}</td>
                              <td className="px-4 py-3">{row.eu}</td>
                              <td className="px-4 py-3">{row.lengthIn}</td>
                              <td className="px-4 py-3 text-right font-medium text-charcoal">
                                {row.lengthCm} cm
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Left column: SVG illustration */}
                    <div className="bg-muted/30 p-4 rounded-2xl flex items-center justify-center border border-border/40">
                      <svg
                        viewBox="0 0 100 120"
                        className="h-36 w-auto text-muted-foreground/30 fill-none stroke-current"
                        strokeWidth="1.5"
                      >
                        {/* A simple foot outline */}
                        <path d="M 50 110 C 35 110, 30 100, 30 80 C 30 60, 40 40, 35 25 C 33 20, 35 15, 42 15 C 48 15, 45 25, 48 30 C 50 35, 53 35, 55 30 C 58 25, 58 15, 63 15 C 68 15, 67 25, 70 35 C 72 40, 75 55, 75 75 C 75 95, 65 110, 50 110 Z" />
                        {/* Measuring tape / line indicator */}
                        <path d="M 50 10 L 50 115" strokeDasharray="3,3" className="stroke-brass" />
                        <path d="M 35 10 L 65 10" className="stroke-brass" />
                        <path d="M 35 115 L 65 115" className="stroke-brass" />
                        {/* A small ruler line details */}
                        <line
                          x1="50"
                          y1="30"
                          x2="55"
                          y2="30"
                          className="stroke-muted-foreground/30"
                        />
                        <line
                          x1="50"
                          y1="50"
                          x2="55"
                          y2="50"
                          className="stroke-muted-foreground/30"
                        />
                        <line
                          x1="50"
                          y1="70"
                          x2="55"
                          y2="70"
                          className="stroke-muted-foreground/30"
                        />
                        <line
                          x1="50"
                          y1="90"
                          x2="55"
                          y2="90"
                          className="stroke-muted-foreground/30"
                        />
                      </svg>
                    </div>

                    {/* Right column: Instructions */}
                    <div className="space-y-4 text-xs text-muted-foreground">
                      <h4 className="font-bold text-sm text-charcoal uppercase tracking-wider mb-2">
                        Measure Heel-To-Toe
                      </h4>
                      <ol className="list-decimal list-inside space-y-2.5 leading-relaxed font-medium">
                        <li>
                          <span className="text-charcoal font-bold">Position your heel:</span> Stand
                          up straight and place your heel against a flat wall.
                        </li>
                        <li>
                          <span className="text-charcoal font-bold">Mark length:</span> Place a
                          sheet of paper flat on the floor underneath your foot, and draw a line at
                          the longest toe.
                        </li>
                        <li>
                          <span className="text-charcoal font-bold">Measure distance:</span> Use a
                          ruler to measure the distance from the wall/edge of the paper to the line
                          in centimeters.
                        </li>
                        <li>
                          <span className="text-charcoal font-bold">Match on chart:</span> Reference
                          the conversion chart tab to find your correct UK/India size!
                        </li>
                      </ol>

                      <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 mt-2">
                        <p className="font-semibold text-primary leading-relaxed">
                          💡 <span className="underline">Pro Tip</span>: Measure your feet in the
                          afternoon since feet swell slightly during the day. If you are between
                          sizes, we recommend ordering the larger size!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2 bg-charcoal text-white hover:bg-charcoal/90 text-xs font-bold rounded-full transition cursor-pointer border-0"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
