"use client";

import { UPCOMING_BILLS, SUBSCRIPTIONS } from "@/lib/mock-data";
import { Calendar, Repeat, AlertCircle } from "lucide-react";
import { MerchantLogo } from "@/components/MerchantLogo";

export default function BillsPage() {
  const totalMonthlyBills = UPCOMING_BILLS.reduce((s, b) => s + b.amount, 0);
  const totalSubscriptions = SUBSCRIPTIONS.reduce((s, sub) => s + sub.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bills & Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">Track recurring payments and upcoming due dates</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-xs text-muted-foreground mb-1">Monthly Bills</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">${totalMonthlyBills.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-xs text-muted-foreground mb-1">Subscriptions</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">${totalSubscriptions.toFixed(2)}/mo</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-xs text-muted-foreground mb-1">Total Recurring</p>
          <p className="text-2xl font-bold text-primary tabular-nums">${(totalMonthlyBills + totalSubscriptions).toFixed(2)}/mo</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Upcoming Bills */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            Upcoming Bills
          </h2>
          <div className="space-y-1">
            {UPCOMING_BILLS.map((bill) => (
              <div key={bill.name} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{bill.name}</p>
                  <p className="text-xs text-muted-foreground">Due {bill.dueDate}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="text-sm font-medium text-foreground tabular-nums">${bill.amount.toFixed(2)}</p>
                  {bill.autopay ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Auto</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium flex items-center gap-0.5">
                      <AlertCircle size={8} /> Manual
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscriptions */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Repeat size={16} className="text-primary" />
            Active Subscriptions
          </h2>
          <div className="space-y-1">
            {SUBSCRIPTIONS.map((sub) => (
              <div key={sub.name} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <MerchantLogo domain={sub.logo} name={sub.name} size={28} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground tabular-nums">${sub.amount.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">{sub.cycle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
