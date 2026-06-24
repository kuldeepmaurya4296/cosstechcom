import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function Logo({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <div 
        className="flex items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent text-white shadow-md border border-white/10 shrink-0"
        style={{ width: size, height: size }}
      >
        <ShoppingBag size={size * 0.55} className="animate-pulse" />
      </div>
      <span className="font-sans text-lg font-extrabold tracking-tight text-neutral-900 dark:text-white hidden sm:inline-flex">
        Cosstech<span className="text-accent">Com</span>
      </span>
    </Link>
  );
}
