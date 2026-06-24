"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";

interface SalesChartProps {
  data?: number[];
  labels?: string[];
}

export function SalesChart({
  data = [42000, 58000, 51000, 73000, 65000, 88000, 79000],
  labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
}: SalesChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const svgWidth = 500;
  const svgHeight = 180;
  const paddingLeft = 55;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 30;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxValRaw = Math.max(...data, 0);
  const maxVal = maxValRaw > 0 ? Math.ceil((maxValRaw * 1.15) / 1000) * 1000 : 1000;

  const points = data.map((v, idx) => {
    const x =
      paddingLeft + (data.length > 1 ? (idx / (data.length - 1)) * chartWidth : chartWidth / 2);
    const y = paddingTop + chartHeight - (v / maxVal) * chartHeight;
    return { x, y };
  });

  const linePath =
    points.length > 0
      ? points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : "";

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : "";

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * svgWidth;

    let closestIndex = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });
    setHoveredIndex(closestIndex);
  };

  return (
    <div
      className="relative w-full h-[180px] select-none"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* Floating HTML tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] !== undefined && (
        <div
          className="absolute bg-charcoal text-cream text-[10px] rounded-lg p-2 shadow-lg border border-brass/10 pointer-events-none transition-all duration-75 z-10 whitespace-nowrap flex flex-col gap-0.5"
          style={{
            left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
            top: `${(points[hoveredIndex].y / svgHeight) * 100 - 8}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-bold text-[9px] text-brass/70 uppercase tracking-wider">
            {labels[hoveredIndex]}
          </div>
          <div className="font-serif font-bold text-xs mt-0.5">{formatINR(data[hoveredIndex])}</div>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
        onMouseMove={handleMouseMove}
      >
        <defs>
          <linearGradient id="dashboardChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#846358" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#846358" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => {
          const y = paddingTop + chartHeight - fraction * chartHeight;
          const val = fraction * maxVal;
          return (
            <g key={i} className="opacity-30">
              <line
                x1={paddingLeft}
                y1={y}
                x2={svgWidth - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="3 3"
                className="text-border"
              />
              <text
                x={paddingLeft - 8}
                y={y}
                textAnchor="end"
                alignmentBaseline="middle"
                className="text-[9px] font-semibold fill-muted-foreground"
              >
                {val >= 100000
                  ? `₹${(val / 100000).toFixed(1)}L`
                  : val >= 1000
                    ? `₹${(val / 1000).toFixed(0)}K`
                    : `₹${val}`}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {points.length > 0 && (
          <path
            d={areaPath}
            fill="url(#dashboardChartGrad)"
            className="transition-all duration-300"
          />
        )}

        {/* Sparkline curve */}
        {points.length > 0 && (
          <path
            d={linePath}
            fill="none"
            stroke="#846358"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        )}

        {/* Hover dot guide */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <g>
            <line
              x1={points[hoveredIndex].x}
              y1={paddingTop}
              x2={points[hoveredIndex].x}
              y2={paddingTop + chartHeight}
              stroke="#846358"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              className="opacity-60"
            />
            <circle
              cx={points[hoveredIndex].x}
              cy={points[hoveredIndex].y}
              r="6.5"
              fill="#846358"
              opacity="0.25"
            />
            <circle
              cx={points[hoveredIndex].x}
              cy={points[hoveredIndex].y}
              r="3.5"
              fill="#846358"
              stroke="#fff"
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* X Axis labels */}
        {labels.map((lbl, idx) => {
          const x =
            paddingLeft +
            (labels.length > 1 ? (idx / (labels.length - 1)) * chartWidth : chartWidth / 2);
          return (
            <text
              key={idx}
              x={x}
              y={svgHeight - 10}
              textAnchor="middle"
              className="text-[9px] font-semibold fill-muted-foreground opacity-80"
            >
              {lbl}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
