import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tint = "primary",
}: {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  tint?: "primary" | "accent" | "brass" | "muted";
}) {
  const tintBg = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    brass: "bg-brass/20 text-charcoal",
    muted: "bg-muted text-muted-foreground",
  }[tint];
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-serif text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-lg grid place-items-center ${tintBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta !== undefined && (
        <div
          className={`mt-3 flex items-center gap-1 text-xs font-medium ${delta >= 0 ? "text-emerald-700" : "text-destructive"}`}
        >
          {delta >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {Math.abs(delta)}%{" "}
          <span className="text-muted-foreground font-normal">vs last month</span>
        </div>
      )}
    </div>
  );
}
