"use client";

import { formatINR } from "@/lib/format";
import { Coins, Scale, Landmark, ShieldAlert, ArrowUpRight, TrendingUp } from "lucide-react";

interface Summary {
  totalSales: number;
  totalCommission: number;
  totalPayouts: number;
  totalShipping: number;
  totalTax: number;
  payoutsCompleted: number;
  payoutsRequested: number;
  totalTcsFiled: number;
  totalTcsPending: number;
  netFeesCollected: number;
}

interface VendorLedger {
  vendorId: string;
  name: string;
  email: string;
  storeName: string;
  grossSales: number;
  commissionCollected: number;
  tcsCollected: number;
  payoutsGenerated: number;
  subOrderCount: number;
}

export default function ReconciliationClient({ summary, ledgers }: { summary: Summary; ledgers: VendorLedger[] }) {
  return (
    <div className="space-y-8">
      {/* Financial Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-brass/10 text-cognac flex items-center justify-center shrink-0">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Total Gross Revenue</p>
            <h3 className="font-serif font-extrabold text-2xl text-charcoal mt-1">{formatINR(summary.totalSales)}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Includes taxes & shipping</p>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Platform Commissions</p>
            <h3 className="font-serif font-extrabold text-2xl text-charcoal mt-1">{formatINR(summary.totalCommission)}</h3>
            <p className="text-[10px] text-emerald-700 mt-0.5">Category share (avg. 10%)</p>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Payouts Completed</p>
            <h3 className="font-serif font-extrabold text-2xl text-charcoal mt-1">{formatINR(summary.payoutsCompleted)}</h3>
            <p className="text-[10px] text-indigo-700 mt-0.5">Pending withdrawal: {formatINR(summary.payoutsRequested)}</p>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">GST TCS (Section 52)</p>
            <h3 className="font-serif font-extrabold text-2xl text-charcoal mt-1">{formatINR(summary.totalTcsFiled + summary.totalTcsPending)}</h3>
            <p className="text-[10px] text-amber-700 mt-0.5">Filed: {formatINR(summary.totalTcsFiled)} | Pending: {formatINR(summary.totalTcsPending)}</p>
          </div>
        </div>
      </div>

      {/* Cashflow Breakdown */}
      <div className="bg-brass/5 border border-brass/25 rounded-2xl p-6 space-y-4">
        <h3 className="font-serif font-bold text-lg text-charcoal flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-cognac" />
          Platform Settlement & Payout Ledger
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Platform cash flow accounts for all customer purchases minus payouts made to sellers. 
          GST Tax Collected at Source (TCS) of 0.5% CGST + 0.5% SGST (1% total) is retained automatically for monthly deposition and return filings under GSTR-8.
        </p>
        <div className="grid sm:grid-cols-3 gap-6 pt-2">
          <div className="bg-card p-4 rounded-xl border border-border/60">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Shipping Reimbursement</p>
            <p className="text-lg font-bold text-charcoal mt-1">{formatINR(summary.totalShipping)}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border/60">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">GST Taxes Collected</p>
            <p className="text-lg font-bold text-charcoal mt-1">{formatINR(summary.totalTax)}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border/60">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Net Platform Net cashflow</p>
            <p className={`text-lg font-bold mt-1 ${summary.netFeesCollected >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatINR(summary.netFeesCollected)}
            </p>
          </div>
        </div>
      </div>

      {/* Vendor Ledger Breakdown Table */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-lg text-charcoal">Vendor-wise Sales & Tax Summary</h3>
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold">
                <th className="px-6 py-4">Vendor / Store</th>
                <th className="px-6 py-4">Sub-Orders</th>
                <th className="px-6 py-4">Gross Sales</th>
                <th className="px-6 py-4">Commissions collected</th>
                <th className="px-6 py-4">TCS Retained (1% GST)</th>
                <th className="px-6 py-4 text-right">Net payout generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {ledgers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No vendor sales records found.
                  </td>
                </tr>
              ) : (
                ledgers.map((v) => (
                  <tr key={v.vendorId} className="hover:bg-cream/15 transition-colors">
                    <td className="px-6 py-4.5">
                      <div>
                        <p className="font-semibold text-charcoal">{v.storeName}</p>
                        <p className="text-xs text-muted-foreground">{v.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-muted-foreground font-medium">
                      {v.subOrderCount} orders
                    </td>
                    <td className="px-6 py-4.5 font-semibold text-charcoal">
                      {formatINR(v.grossSales)}
                    </td>
                    <td className="px-6 py-4.5 text-emerald-700 font-semibold">
                      {formatINR(v.commissionCollected)}
                    </td>
                    <td className="px-6 py-4.5 text-amber-700 font-semibold">
                      {formatINR(v.tcsCollected)}
                    </td>
                    <td className="px-6 py-4.5 text-right font-extrabold text-cognac">
                      {formatINR(v.payoutsGenerated)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
