"use client";

import { useEffect, useState } from "react";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { getUserId, fetchNextMonthPrediction, type CategoryPrediction } from "@/lib/api";

const CATEGORY_META: Record<string, { color: string; emoji: string }> = {
  food: { color: "#F97316", emoji: "🍔" },
  transport: { color: "#FBBF24", emoji: "⛽" },
  entertainment: { color: "#7C3AED", emoji: "🎮" },
  shopping: { color: "#EC4899", emoji: "🛍️" },
  utilities: { color: "#0EA5E9", emoji: "💡" },
  subscription: { color: "#8B5CF6", emoji: "📱" },
  subscriptions: { color: "#8B5CF6", emoji: "📱" },
  other: { color: "#94A3B8", emoji: "📦" },
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
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200/60 dark:border-red-800/30 flex items-center gap-1">
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
          <p className={`text-lg font-bold tabular-nums ${totalPct > 100 ? "text-red-500" : "text-green-600"}`}>
            {totalPct}%
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {predictions.slice(0, 6).map((pred) => {
          const pct = pred.budgeted > 0 ? Math.min((pred.predicted / pred.budgeted) * 100, 120) : 0;
          const meta = CATEGORY_META[pred.category.toLowerCase()] || CATEGORY_META.other;
          return (
            <div key={pred.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{meta.emoji}</span>
                  <span className="text-xs text-muted-foreground capitalize">{pred.category}</span>
                </div>
                <span className={`text-xs font-medium tabular-nums ${pred.over_budget ? "text-red-500" : "text-foreground"}`}>
                  ${pred.predicted.toLocaleString()}{pred.budgeted > 0 ? ` / $${pred.budgeted}` : ""}
                </span>
              </div>
              {pred.budgeted > 0 && (
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: pred.over_budget ? "#DC2626" : meta.color,
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
