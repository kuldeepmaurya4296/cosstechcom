"use client";

import React, { useState } from "react";
import { toast } from "sonner";

export function NewsletterFormClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      toast.error("Please provide your name.");
      return;
    }
    if (!trimmedEmail) {
      toast.error("Please provide your email address.");
      return;
    }
    if (!trimmedPhone || trimmedPhone.replace(/\D/g, "").length < 10) {
      toast.error("Please provide a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          message: trimmedMessage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      toast.success(data.message || "Thank you for joining our club!");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="mt-8 max-w-xl mx-auto text-left space-y-4 relative z-10"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-charcoal/80 block px-1">Full Name *</label>
          <input
            type="text"
            placeholder="e.g. Rahul Maurya"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground outline-none shadow-sm transition"
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-charcoal/80 block px-1">
            Email Address *
          </label>
          <input
            type="email"
            placeholder="e.g. rahul@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground outline-none shadow-sm transition"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-charcoal/80 block px-1">Mobile Number *</label>
        <input
          type="tel"
          placeholder="e.g. 9876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-card text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground outline-none shadow-sm transition"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-charcoal/80 block px-1">
          Message (Optional)
        </label>
        <textarea
          placeholder="How can we help you? e.g. Interested in custom bridal footwear sizing, store visits..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-card text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground outline-none shadow-sm resize-none transition"
          disabled={loading}
        />
      </div>

      <div className="pt-2 flex justify-center">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-xs md:text-sm font-semibold hover:opacity-95 transition cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2 shadow-md w-full sm:w-auto"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
              Joining Club...
            </>
          ) : (
            "Join Club & Send Message"
          )}
        </button>
      </div>
    </form>
  );
}
