"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Package, Heart, MapPin, Settings, LogOut, ShieldCheck, Award } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const items = [
  { href: "/account", label: "Overview", icon: User, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/loyalty", label: "Loyalty Points", icon: Award },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile Settings", icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=" + encodeURIComponent(pathname));
    }
  }, [status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground text-sm font-semibold tracking-wide">
          Securing session...
        </p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-[1200px]">
      {/* Premium Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-charcoal to-cognac text-cream p-6 md:p-8 shadow-lg border border-brass/10 mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(181,164,144,0.15),transparent)] pointer-events-none" />
        <div className="flex items-center gap-5 relative z-10 min-w-0 w-full sm:w-auto">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-brass/35 text-cream flex items-center justify-center font-serif font-bold text-2xl uppercase border-2 border-brass/30 shadow-md shrink-0 overflow-hidden">
            {!imgError && session.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span>{session.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brass/80 block mb-1">
              Customer Space
            </span>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight break-words">
              Hello, {session.user?.name || "Customer"}
            </h1>
            <p className="text-xs text-cream/70 mt-1 font-medium truncate">{session.user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-cream/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-cream/10 w-fit shrink-0 relative z-10 self-start md:self-auto">
          <ShieldCheck className="h-4.5 w-4.5 text-brass" />
          <div className="text-left">
            <span className="text-[9px] uppercase font-bold tracking-wider text-brass block">
              Verified Account
            </span>
            <span className="text-[10px] text-cream/80 font-semibold block">
              CosstechCom Club Member
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-[250px_1fr] gap-8 items-start">
        <aside className="lg:sticky lg:top-20 z-10 bg-card border border-border p-4 rounded-2xl shadow-sm w-full min-w-0 overflow-hidden">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible scrollbar-hide py-1 lg:py-0">
            {items.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href) && href !== "/account";
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors ${active ? "text-brass" : "text-muted-foreground"}`}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap text-red-500 hover:bg-red-500/5 cursor-pointer text-center lg:text-left lg:w-full transition-colors lg:mt-2 lg:border-t lg:border-border/40 lg:pt-4 w-auto mt-0 border-t-0 pt-0"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Dashboard Area */}
        <div className="min-w-0 bg-card border border-border p-6 md:p-8 rounded-2xl shadow-sm min-h-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
