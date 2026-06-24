"use client";

import React, { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const url = `https://wa.me/916263638053?text=${encodeURIComponent(message.trim())}`;
    window.open(url, "_blank");
    setMessage("");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-card border border-border shadow-2xl rounded-2xl p-4 w-72 mb-4 relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-2 mb-3">
              <div>
                <h4 className="text-xs font-bold text-foreground">CosstechCom Helpdesk</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">We typically reply in under 5 minutes!</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded-lg transition"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Bubble note */}
            <div className="bg-muted/50 border border-border/40 rounded-xl p-2.5 text-[11px] text-muted-foreground leading-relaxed mb-3">
              Hello there! 👋 Let us know how we can assist you with products, orders, or seller listings today!
            </div>

            {/* Form */}
            <form onSubmit={handleStartChat} className="flex gap-1.5">
              <input
                type="text"
                placeholder="Type your message..."
                className="bg-muted/75 border border-border/40 rounded-xl px-3 py-1.5 text-xs flex-1 outline-none text-foreground"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl p-2 transition flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-12 w-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 shrink-0"
        title="Chat with support on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
