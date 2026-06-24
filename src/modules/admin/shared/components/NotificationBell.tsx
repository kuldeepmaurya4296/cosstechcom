"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Clock, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ActivityLog {
  _id: string;
  adminName: string;
  action: string;
  details?: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/activity-log?limit=8");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/admin/activity-log", { method: "PATCH" });
      if (res.ok) {
        setLogs((prev) => prev.map((log) => ({ ...log, isRead: true })));
        toast.success("All notifications marked as read.");
      }
    } catch (err) {
      toast.error("Failed to mark notifications as read.");
    }
  };

  const unreadCount = logs.filter((log) => !log.isRead).length;

  const formatLogTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-muted rounded-full relative cursor-pointer group transition-colors"
        aria-label="Admin notifications"
      >
        <Bell className="h-4.5 w-4.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 h-4 w-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white border border-border/80 rounded-2xl shadow-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4.5 py-3.5 border-b border-border/60 bg-neutral-50/50 flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-charcoal">
                Audit Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-brass hover:text-cognac flex items-center gap-1 cursor-pointer transition-colors border-0"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
              {logs.length === 0 ? (
                <div className="py-8 px-4.5 text-center text-xs text-muted-foreground italic">
                  No notifications yet.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log._id}
                    className={`p-3.5 flex gap-2.5 items-start transition-colors ${
                      !log.isRead ? "bg-brass/5" : "hover:bg-neutral-50/50"
                    }`}
                  >
                    <div className="p-1.5 bg-neutral-100 rounded-lg text-muted-foreground mt-0.5 shrink-0">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-grow min-w-0 space-y-0.5">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="font-bold text-xs text-charcoal truncate">
                          {log.adminName}
                        </span>
                        <span className="text-[9px] text-muted-foreground/80 shrink-0 font-medium flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatLogTime(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brass font-sans">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      {log.details && (
                        <p className="text-[11px] text-muted-foreground leading-normal font-medium">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4.5 py-2.5 bg-neutral-50 border-t border-border/40 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full text-center border-0"
              >
                Close Panel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
