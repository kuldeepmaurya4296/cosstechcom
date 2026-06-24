interface ColorInfo {
  name: string;
  hex: string;
}

interface ColorSelectorProps {
  colors: ColorInfo[];
  selectedColor: string;
  onSelect: (color: string) => void;
}

export function ColorSelector({ colors, selectedColor, onSelect }: ColorSelectorProps) {
  return (
    <div>
      <p className="text-sm font-semibold mb-2.5">
        Color:{" "}
        <span className="font-normal text-muted-foreground">{selectedColor || "Select color"}</span>
      </p>
      <div className="flex flex-wrap gap-3">
        {colors.map((c) => {
          const isSelected = selectedColor?.toLowerCase() === c.name.toLowerCase();
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => onSelect(c.name)}
              title={c.name}
              className={`relative h-10 w-10 rounded-full border-2 flex items-center justify-center transition cursor-pointer outline-none hover:scale-105 active:scale-95 ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-charcoal"
              }`}
            >
              {/* Internal color circle */}
              <span
                className="h-7 w-7 rounded-full shadow-inner border border-black/10"
                style={{ backgroundColor: c.hex }}
              />
              {/* Highlight active indicator dot */}
              {isSelected && (
                <span className="absolute -bottom-1 h-1.5 w-1.5 bg-primary rounded-full animate-in zoom-in-50 duration-200" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
