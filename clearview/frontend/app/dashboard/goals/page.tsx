"use client";

import { useEffect, useState } from "react";
import { Target, TrendingDown, Shield, Plane, GraduationCap } from "lucide-react";
import { getUserId, clearAuth, fetchDashboard } from "@/lib/api";

const GOAL_ICONS: Record<string, React.ElementType> = { Shield, Plane, GraduationCap, Target };

interface FinancialGoal {
  name: string;
  target_amount?: number;
  current_amount?: number;
  target?: number;
  current?: number;
  icon?: string;
}

interface Account {
  _id: string;
  name: string;
  type: string;
  balance: number;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) { setLoading(false); return; }
    fetchDashboard(uid)
      .then((d) => {
        const profile = d.financial_profile as { financial_goals?: FinancialGoal[] } | null;
        setGoals(profile?.financial_goals || []);
        setAccounts(d.accounts as unknown as Account[]);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("404") || msg.includes("401")) { clearAuth(); window.location.href = "/auth"; }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const debtAccounts = accounts.filter((a) => a.type === "credit" && a.balance < 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financial Goals</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your progress and manage debt</p>
      </div>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const current = goal.current_amount ?? goal.current ?? 0;
            const target = goal.target_amount ?? goal.target ?? 0;
            const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
            const GoalIcon = GOAL_ICONS[goal.icon || "Target"] || Target;
            return (
              <div key={goal.name} className="rounded-2xl bg-card border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <GoalIcon size={24} className="text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{goal.name}</h3>
                    <p className="text-xs text-muted-foreground">{pct}% complete</p>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden mb-3">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-foreground tabular-nums">${current.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">${target.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border p-8 text-center">
          <Target size={40} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">No financial goals set yet. Goals can be added to your financial profile.</p>
        </div>
      )}

      {debtAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingDown size={20} className="text-primary" />
            Debt Overview
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {debtAccounts.map((acct) => {
              const balance = Math.abs(acct.balance);
              return (
                <div key={acct._id} className="rounded-2xl bg-card border border-border p-6">
                  <h3 className="text-sm font-bold text-foreground mb-2">{acct.name}</h3>
                  <p className="text-2xl font-bold text-foreground tabular-nums mb-1">${balance.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Outstanding balance</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
