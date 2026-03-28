"use client";

import { FINANCIAL_GOALS, LOANS } from "@/lib/mock-data";
import { Target, TrendingDown, Shield, Plane, GraduationCap } from "lucide-react";

const GOAL_ICONS = { Shield, Plane, GraduationCap } as const;

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financial Goals</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your progress and manage debt</p>
      </div>

      {/* Goals */}
      <div className="grid grid-cols-3 gap-4">
        {FINANCIAL_GOALS.map((goal) => {
          const pct = Math.round((goal.current / goal.target) * 100);
          return (
            <div key={goal.name} className="rounded-2xl bg-card border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                {(() => { const I = GOAL_ICONS[goal.icon]; return I ? <I size={24} className="text-primary" /> : null; })()}
                <div>
                  <h3 className="text-sm font-bold text-foreground">{goal.name}</h3>
                  <p className="text-xs text-muted-foreground">{pct}% complete</p>
                </div>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden mb-3">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground tabular-nums">${goal.current.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground tabular-nums">${goal.target.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loans */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingDown size={20} className="text-primary" />
          Loans & Debt
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {LOANS.map((loan) => {
            const paidOff = Math.round(((loan.originalAmount - loan.balance) / loan.originalAmount) * 100);
            return (
              <div key={loan.name} className="rounded-2xl bg-card border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground">{loan.name}</h3>
                  <span className="text-xs text-muted-foreground">{loan.rate}% APR</span>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums mb-1">${loan.balance.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mb-4">remaining of ${loan.originalAmount.toLocaleString()}</p>
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${paidOff}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600 font-medium">{paidOff}% paid off</span>
                  <span className="text-muted-foreground">${loan.monthlyPayment}/mo</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
