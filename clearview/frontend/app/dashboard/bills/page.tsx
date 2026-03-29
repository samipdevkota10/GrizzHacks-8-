"use client";

import { useEffect, useState } from "react";
import { Calendar, Repeat } from "lucide-react";
import { MerchantLogo } from "@/components/MerchantLogo";
import {
  getUserId,
  fetchDashboard,
  type DashboardData,
  type Subscription,
  type UpcomingBill,
} from "@/lib/api";

export default function BillsPage() {
  const [bills, setBills] = useState<UpcomingBill[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) { setLoading(false); return; }
    fetchDashboard(uid)
      .then((d) => {
        setBills(d.upcoming_bills);
        setSubscriptions(
          (d.subscriptions as unknown as Subscription[]).filter((s) => s.status === "active"),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalMonthlyBills = bills.reduce((s, b) => s + b.amount, 0);
  const totalSubscriptions = subscriptions.reduce((s, sub) => s + sub.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bills & Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">Track recurring payments and upcoming due dates</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-xs text-muted-foreground mb-1">Upcoming Bills</p>
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
        <div className="rounded-2xl bg-card border border-border p-5">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            Upcoming Bills
          </h2>
          <div className="space-y-1">
            {bills.length > 0 ? bills.map((bill) => (
              <div key={bill.name} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{bill.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {new Date(bill.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <p className="text-sm font-medium text-foreground tabular-nums">${bill.amount.toFixed(2)}</p>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming bills</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-5">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Repeat size={16} className="text-primary" />
            Active Subscriptions
          </h2>
          <div className="space-y-1">
            {subscriptions.length > 0 ? subscriptions.map((sub) => (
              <div key={sub._id} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <MerchantLogo domain={sub.logo_url} name={sub.name} size={28} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground tabular-nums">${sub.amount.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">{sub.billing_cycle}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No active subscriptions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
