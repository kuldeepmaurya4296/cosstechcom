"use client";

import { DashboardPage } from "@/modules/admin/dashboard/components/DashboardLayout";
import { currentVendor } from "@/data/vendors";

export default function VendorSettingsPage() {
  return (
    <DashboardPage eyebrow="Profile" title="Vendor settings">
      <div className="bg-card border border-border rounded-xl p-6 max-w-2xl space-y-5">
        {[
          ["Brand name", currentVendor.name],
          ["Tagline", currentVendor.tagline],
          ["Email", currentVendor.email],
        ].map(([l, v]) => (
          <label key={l} className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {l}
            </span>
            <input
              defaultValue={v}
              className="mt-1.5 w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm"
            />
          </label>
        ))}
        <button className="bg-accent text-accent-foreground rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer">
          Save changes
        </button>
      </div>
    </DashboardPage>
  );
}
