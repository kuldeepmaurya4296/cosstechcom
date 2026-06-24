"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import { NotificationBell } from "@/modules/admin/shared/components/NotificationBell";
import {
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Store,
  Settings,
  Tag,
  Globe,
  Ticket,
  Wallet,
  HelpCircle,
  MessageSquare,
  Truck,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Store,
  Settings,
  Tag,
  Globe,
  Ticket,
  Wallet,
  HelpCircle,
  MessageSquare,
  Truck,
  Zap,
};

export interface NavItem {
  to?: string;
  label: string;
  icon: string;
  exact?: boolean;
  items?: { to: string; label: string }[];
}

export function DashboardLayout({
  items,
  title,
  accent = "primary",
  children,
}: {
  items: NavItem[];
  title: string;
  accent?: "primary" | "accent";
  children: ReactNode;
}) {
  const path = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const [headerImgError, setHeaderImgError] = useState(false);
  const [sidebarImgError, setSidebarImgError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Track expanded parent submenus
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Inventory: true, // open Inventory submenu by default
  });

  const toggleMenu = (lbl: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [lbl]: !prev[lbl],
    }));
  };

  const handleParentClick = (label: string) => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
      setExpandedMenus((prev) => ({ ...prev, [label]: true }));
    } else {
      toggleMenu(label);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col h-screen border-r border-sidebar-border/40 shrink-0 ${
          sidebarOpen
            ? "w-64 translate-x-0"
            : "w-0 -translate-x-full lg:w-[72px] lg:translate-x-0 overflow-hidden"
        }`}
      >
        <div
          className={`flex flex-col h-full shrink-0 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-64 lg:w-[72px]"}`}
        >
          {/* Header */}
          <div
            className={`h-16 px-5 flex items-center justify-between border-b border-sidebar-border/40 shrink-0 ${sidebarOpen ? "" : "lg:px-0 lg:justify-center"}`}
          >
            {sidebarOpen ? (
              <>
                <Logo size={32} />
                <button
                  className="p-1.5 hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-full transition-colors cursor-pointer"
                  onClick={() => setSidebarOpen(false)}
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
              </>
            ) : (
              <button
                className="p-1.5 hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-xl transition-all cursor-pointer flex items-center justify-center"
                onClick={() => setSidebarOpen(true)}
                title="Expand Sidebar"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            )}
          </div>

          {/* Navigation Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto py-4 space-y-5 scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
            <div className="px-5">
              {sidebarOpen && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
                  {title}
                </div>
              )}
            </div>
            <nav className="px-3 space-y-1">
              {items.map(({ to, label, icon, exact, items: subItems }) => {
                const Icon = iconMap[icon] || HelpCircle;
                const hasSubItems = !!subItems && subItems.length > 0;

                if (hasSubItems) {
                  const isExpanded = !!expandedMenus[label];
                  const isAnyChildActive = subItems.some(
                    (sub) => path === sub.to || path.startsWith(sub.to + "/"),
                  );

                  return (
                    <div key={label} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => handleParentClick(label)}
                        title={sidebarOpen ? undefined : label}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium transition rounded-lg cursor-pointer text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground ${
                          isAnyChildActive ? "text-brass bg-sidebar-accent/30 font-semibold" : ""
                        } ${sidebarOpen ? "" : "lg:justify-center lg:px-0"}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {sidebarOpen && <span>{label}</span>}
                        </div>
                        {sidebarOpen && (
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform duration-200 text-sidebar-foreground/50 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>
                      {sidebarOpen && isExpanded && (
                        <div className="pl-9 space-y-0.5 border-l border-sidebar-border/30 ml-5">
                          {subItems.map((sub) => {
                            const active = sub.to === path || path.startsWith(sub.to + "/");
                            const activeStyles =
                              accent === "accent"
                                ? "text-brass font-semibold"
                                : "text-brass font-semibold";
                            return (
                              <Link
                                key={sub.to}
                                href={sub.to}
                                onClick={handleLinkClick}
                                className={`block py-1.5 text-xs transition ${
                                  active
                                    ? activeStyles
                                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                                }`}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = exact
                  ? path === to
                  : to
                    ? path === to || path.startsWith(to + "/")
                    : false;
                const activeStyles =
                  accent === "accent"
                    ? "bg-sidebar-accent text-brass font-semibold"
                    : "bg-sidebar-accent text-brass font-semibold";
                return (
                  <Link
                    key={to || label}
                    href={to || "#"}
                    onClick={handleLinkClick}
                    title={sidebarOpen ? undefined : label}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      active
                        ? activeStyles
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    } ${sidebarOpen ? "" : "lg:justify-center lg:px-0"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {sidebarOpen && <span>{label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-sidebar-border/40 flex flex-col gap-3 bg-sidebar/95 backdrop-blur-md shrink-0">
            {session?.user && (
              <div
                className={`flex items-center gap-2.5 p-2 bg-sidebar-accent/40 rounded-xl border border-sidebar-border/30 transition-all duration-300 ${
                  sidebarOpen ? "" : "lg:justify-center lg:p-1.5"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm uppercase shadow-sm shrink-0 overflow-hidden">
                  {!sidebarImgError && session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={() => setSidebarImgError(true)}
                    />
                  ) : (
                    <span>
                      {session.user.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-sidebar-foreground truncate">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-[10px] text-sidebar-foreground/60 truncate capitalize">
                      {(session.user as any).role || "admin"}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/"
                title={sidebarOpen ? undefined : "Back to store"}
                className={`flex items-center justify-center gap-2 text-xs font-semibold bg-sidebar-accent border border-sidebar-border/60 hover:bg-sidebar-accent/80 hover:text-white rounded-xl text-sidebar-foreground/80 transition-all cursor-pointer shadow-sm ${
                  sidebarOpen ? "px-3 py-2.5" : "lg:w-10 lg:h-10 lg:p-0 mx-auto"
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {sidebarOpen && <span>Back to store</span>}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title={sidebarOpen ? undefined : "Logout"}
                className={`flex items-center justify-center gap-2 text-xs font-semibold border border-red-500/20 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl cursor-pointer transition-all ${
                  sidebarOpen ? "px-3 py-2.5 w-full" : "lg:w-10 lg:h-10 lg:p-0 mx-auto"
                }`}
              >
                <LogOut className="h-3.5 w-3.5" />
                {sidebarOpen && <span>Logout</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif text-lg md:text-xl font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-foreground">
                  {session?.user?.name || "Admin"}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize">
                  {(session?.user as any)?.role || "admin"}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold uppercase shrink-0 overflow-hidden">
                  {!headerImgError && session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={() => setHeaderImgError(true)}
                    />
                  ) : (
                    <span>
                      {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline text-sm font-medium">Logout</span>
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function DashboardPage({
  children,
  eyebrow,
  title,
  action,
}: {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {(eyebrow || title || action) && (
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            {eyebrow && (
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="font-serif text-2xl md:text-3xl font-bold">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
