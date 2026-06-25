"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface ShippingMethod {
  id: string;
  name: string;
  desc: string;
  price: number;
}

export interface Settings {
  storeName: string;
  supportEmail: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  defaultReturnDays: number;
  shippingMethods: ShippingMethod[];
  razorpayEnabled: boolean;
  codEnabled: boolean;
}

interface SettingsContextType extends Settings {
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  storeName: "CosstechCom",
  supportEmail: "care@cosstechcom.com",
  currency: "INR — ₹",
  currencySymbol: "₹",
  taxRate: 8,
  defaultReturnDays: 7,
  shippingMethods: [
    { id: "std", name: "Standard", desc: "5–7 days", price: 0 },
    { id: "exp", name: "Express", desc: "2–3 days", price: 150 },
    { id: "same", name: "Same-day (Jawa Rewa)", desc: "Today", price: 350 },
  ],
  razorpayEnabled: true,
  codEnabled: true,
};

const SettingsContext = createContext<SettingsContextType>({
  ...defaultSettings,
  loading: true,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          setState(data);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    await fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ ...state, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
