"use client";

import { Gauge } from "lucide-react";
import type { BudgetPulse } from "@/lib/api";

const STATUS_COLORS = {
  safe: { bar: "bg-green-500", label: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30" },
  warning: { bar: "bg-amber-500", label: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30" },
  critical: { bar: "bg-red-500", label: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/30" },
} as const;

export function BudgetPulseCard({
  pulse,
  budget,
}: {
  pulse: BudgetPulse;
  budget: number;
}) {
  const style = STATUS_COLORS[pulse.status];
  const pct = budget > 0 ? Math.min((pulse.spent_to_date / budget) * 100, 100) : 0;
  const projectedPct = budget > 0 ? Math.min((pulse.projected_month_spend / budget) * 100, 150) : 0;

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Gauge size={16} className="text-primary" />
          Budget Pulse
        </h3>
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${style.label}`}>
          {pulse.status}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Spent so far</span>
            <span className="font-medium text-foreground tabular-nums">
              ${pulse.spent_to_date.toLocaleString()} / ${budget.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Daily Burn</p>
            <p className="text-sm font-bold text-foreground tabular-nums">${pulse.burn_rate_daily.toFixed(0)}/d</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Projected</p>
            <p className={`text-sm font-bold tabular-nums ${projectedPct > 100 ? "text-red-500" : "text-foreground"}`}>
              ${pulse.projected_month_spend.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Forecast Left</p>
            <p className={`text-sm font-bold tabular-nums ${pulse.forecast_remaining < 0 ? "text-red-500" : "text-green-600"}`}>
              {pulse.forecast_remaining < 0 ? "-" : ""}${Math.abs(pulse.forecast_remaining).toLocaleString()}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Day {pulse.days_elapsed} of {pulse.days_in_month}
        </p>
      </div>
    </div>
  );
}
