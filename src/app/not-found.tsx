import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-cream/25 text-charcoal px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated Compass Icon Container */}
        <div className="relative mx-auto w-24 h-24 bg-card rounded-full shadow-md flex items-center justify-center border border-border/60 animate-bounce">
          <Compass className="h-12 w-12 text-cognac animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brass opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-brass"></span>
          </span>
        </div>

        {/* Brand/Heading Info */}
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.25em] text-cognac uppercase">
            Error 404 — Lost Page
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Page Not Found
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            The product page or destination you are seeking has wandered off the path or has been
            no longer available on our site.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/shop"
            className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:bg-primary/95 transition-all shadow-sm flex items-center justify-center gap-2 group cursor-pointer"
          >
            Explore All Products
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-card border border-border/80 text-charcoal hover:bg-muted text-sm font-semibold rounded-full transition-all flex items-center justify-center cursor-pointer"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
