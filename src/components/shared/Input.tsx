interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  wide?: boolean;
}

export function Input({ label, wide, className = "", ...props }: InputProps) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="block text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5">
        {label}
      </span>
      <input
        className={`w-full bg-cream/35 border border-border/80 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cognac focus:ring-1 focus:ring-brass/40 transition-all duration-300 placeholder:text-muted-foreground/60 ${className}`}
        {...props}
      />
    </label>
  );
}
