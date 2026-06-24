interface CheckoutStepsHeaderProps {
  step: 1 | 2 | 3;
}

export function CheckoutStepsHeader({ step }: CheckoutStepsHeaderProps) {
  const steps = ["Shipping Details", "Method & Coupon", "Secure Payment"];
  return (
    <div className="flex flex-row items-center justify-between gap-4 md:gap-8 mb-10 pb-6 border-b border-border/40">
      {steps.map((s, i) => {
        const isCompleted = i + 1 < step;
        const isActive = i + 1 === step;

        return (
          <div key={s} className="flex-1 flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border shrink-0 ${
                isActive
                  ? "bg-charcoal text-cream border-charcoal shadow-md scale-105"
                  : isCompleted
                    ? "bg-cognac text-cream border-cognac"
                    : "bg-cream/40 text-muted-foreground border-border/60"
              }`}
            >
              {isCompleted ? "✓" : i + 1}
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className={`text-[9px] font-extrabold uppercase tracking-widest ${isActive ? "text-cognac" : "text-muted-foreground"}`}
              >
                Step 0{i + 1}
              </span>
              <span
                className={`text-xs md:text-sm font-serif truncate ${isActive ? "font-bold text-charcoal" : isCompleted ? "text-charcoal/80 font-medium" : "text-muted-foreground"}`}
              >
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden md:block flex-1 h-[2px] bg-border/40 mx-4 relative overflow-hidden">
                <div
                  className={`absolute inset-0 bg-cognac transition-all duration-500 ${
                    isCompleted ? "w-full" : "w-0"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
