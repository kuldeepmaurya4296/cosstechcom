import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  onChange: (qty: number) => void;
  size?: "sm" | "md";
}

export function QuantitySelector({ quantity, onChange, size = "md" }: QuantitySelectorProps) {
  const isSm = size === "sm";
  return (
    <div className="flex items-center border border-border rounded-full bg-background">
      <button
        onClick={() => onChange(Math.max(1, quantity - 1))}
        className={`${isSm ? "h-8 w-8" : "h-12 w-12"} grid place-items-center hover:bg-muted rounded-full transition`}
      >
        <Minus className={isSm ? "h-3 w-3" : "h-4 w-4"} />
      </button>
      <span className={`${isSm ? "w-6 text-sm" : "w-8"} text-center font-semibold`}>
        {quantity}
      </span>
      <button
        onClick={() => onChange(quantity + 1)}
        className={`${isSm ? "h-8 w-8" : "h-12 w-12"} grid place-items-center hover:bg-muted rounded-full transition`}
      >
        <Plus className={isSm ? "h-3 w-3" : "h-4 w-4"} />
      </button>
    </div>
  );
}
