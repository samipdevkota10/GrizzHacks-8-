"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  UtensilsCrossed,
  Car,
  Gamepad2,
  ShoppingBag,
  Lightbulb,
  Smartphone,
  Package,
  type LucideIcon,
} from "lucide-react";
import { getUserId, fetchNextMonthPrediction, type CategoryPrediction } from "@/lib/api";

const CATEGORY_META: Record<string, { color: string; icon: LucideIcon }> = {
  food: { color: "#C2410C", icon: UtensilsCrossed },
  transport: { color: "#B45309", icon: Car },
  entertainment: { color: "#6D28D9", icon: Gamepad2 },
  shopping: { color: "#9F1239", icon: ShoppingBag },
  utilities: { color: "#1E6A8A", icon: Lightbulb },
  subscription: { color: "#7E22CE", icon: Smartphone },
  subscriptions: { color: "#7E22CE", icon: Smartphone },
  other: { color: "#64748B", icon: Package },
};

export function SpendingPredictionCard() {
  const [predictions, setPredictions] = useState<CategoryPrediction[]>([]);
  const [totalPredicted, setTotalPredicted] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;
    fetchNextMonthPrediction(uid)
      .then((data) => {
        setPredictions(data.predictions);
        setTotalPredicted(data.total_predicted);
        setTotalBudget(data.total_budget);
      })
      .catch(() => {});
  }, []);

  if (predictions.length === 0) return null;

  const overBudgetCount = predictions.filter((p) => p.over_budget).length;
  const totalPct = totalBudget > 0 ? Math.round((totalPredicted / totalBudget) * 100) : 0;

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          Next Month Forecast
        </h3>
        {overBudgetCount > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-primary border border-border flex items-center gap-1">
            <AlertTriangle size={9} />
            {overBudgetCount} over budget
          </span>
        )}
      </div>

      <div className="flex items-end justify-between mb-4 p-3.5 rounded-xl bg-muted/50">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Predicted</p>
          <p className="text-xl font-bold text-foreground tabular-nums">${totalPredicted.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Budget</p>
          <p className="text-xl font-bold text-foreground tabular-nums">${totalBudget.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold tabular-nums ${totalPct > 100 ? "text-primary" : "text-foreground"}`}>
            {totalPct}%
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {predictions.slice(0, 6).map((pred) => {
          const pct = pred.budgeted > 0 ? Math.min((pred.predicted / pred.budgeted) * 100, 120) : 0;
          const meta = CATEGORY_META[pred.category.toLowerCase()] || CATEGORY_META.other;
          const CatIcon = meta.icon;
          return (
            <div key={pred.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <CatIcon size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">{pred.category}</span>
                </div>
                <span className={`text-xs font-medium tabular-nums ${pred.over_budget ? "text-primary" : "text-foreground"}`}>
                  ${pred.predicted.toLocaleString()}{pred.budgeted > 0 ? ` / $${pred.budgeted}` : ""}
                </span>
              </div>
              {pred.budgeted > 0 && (
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: pred.over_budget ? "var(--color-primary)" : meta.color,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
