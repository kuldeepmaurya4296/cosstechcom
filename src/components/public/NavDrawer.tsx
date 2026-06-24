"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { X, User, ArrowRight } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import Image from "next/image";

interface NavDrawerProps {
  onClose: () => void;
  categoriesList: any[];
  session: any;
  accountLink: string;
}

export function NavDrawer({ onClose, categoriesList, session, accountLink }: NavDrawerProps) {
  const [drawerAvatarError, setDrawerAvatarError] = useState(false);

  const links = categoriesList.map((c) => ({
    href: `/shop?category=${c.slug}`,
    label: c.name.replace(" Footwear", ""),
  }));

  return (
    <>
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="md:hidden fixed inset-0 bg-charcoal z-40 backdrop-blur-xs"
      />

      <motion.nav
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
        className="md:hidden fixed top-0 left-0 bottom-0 h-full w-[72vw] max-w-[290px] bg-card border-r border-border shadow-2xl z-50 flex flex-col overflow-y-auto"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Logo size={32} />
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-xl transition"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-1 flex-grow p-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold px-3 mb-1">
            Shop by Category
          </p>
          <Link
            href="/shop"
            onClick={onClose}
            className="px-3 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:bg-muted text-foreground"
          >
            All Footwear
          </Link>
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={onClose}
              className="px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted text-foreground/75 hover:text-foreground uppercase tracking-wider transition-all"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-border p-4 mt-auto">
          {session ? (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl border border-border/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase shadow-sm shrink-0 border border-primary/15 overflow-hidden">
                {!drawerAvatarError && session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full rounded-full object-cover"
                    onError={() => setDrawerAvatarError(true)}
                  />
                ) : session.user?.name ? (
                  session.user.name
                    .split(" ")
                    .map((n: any) => n[0])
                    .join("")
                    .slice(0, 2)
                ) : (
                  "U"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {session.user?.name || "Member"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{session.user?.email}</p>
              </div>
              <Link
                href={accountLink}
                onClick={onClose}
                className="p-1.5 bg-card hover:bg-muted rounded-lg border border-border text-xs font-bold text-primary transition shrink-0"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-95 transition"
            >
              <User className="h-3.5 w-3.5" />
              Sign In to Your Account
            </Link>
          )}
        </div>
      </motion.nav>
    </>
  );
}
