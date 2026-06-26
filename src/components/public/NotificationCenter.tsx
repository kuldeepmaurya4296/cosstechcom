"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Wallet, ShoppingBag, MessageSquare, Tag, ShieldAlert, Check, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface NotificationItem {
  _id: string;
  type: 'order' | 'promo' | 'wallet' | 'ticket' | 'system' | 'payout' | 'kyc';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

function formatTimeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 1) return "just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotificationCenter() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (session) {
      fetchNotifications();
    }
  }, [session]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string, link?: string) => {
    try {
      const res = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
        );
        if (link) {
          window.location.href = link;
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!mounted || !session) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-4 w-4 text-cognac" />;
      case "wallet":
        return <Wallet className="h-4 w-4 text-emerald-600" />;
      case "ticket":
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case "promo":
        return <Tag className="h-4 w-4 text-amber-600" />;
      case "kyc":
      case "system":
      case "payout":
        return <ShieldAlert className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-neutral-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2.5 hover:bg-muted rounded-xl transition-all group cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground/70 group-hover:text-primary transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 rounded-full h-2 w-2 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-card border border-border shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center border-b border-border pb-3 mb-3">
            <h3 className="font-serif text-sm font-bold text-charcoal">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-primary hover:text-cognac transition flex items-center gap-1 cursor-pointer"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => markAsRead(n._id, n.link)}
                  className={`flex gap-3 p-2.5 rounded-xl border transition cursor-pointer hover:bg-neutral-50/50 ${
                    n.isRead ? "bg-transparent border-transparent" : "bg-neutral-50/80 border-neutral-100"
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <p className={`text-[11px] text-charcoal leading-snug truncate ${!n.isRead ? "font-bold" : "font-medium"}`}>
                        {n.title}
                      </p>
                      <span className="text-[9px] text-neutral-400 shrink-0">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 break-words">
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
