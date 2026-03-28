"use client";

import { motion } from "motion/react";
import { NumberTicker } from "@/components/motion/NumberTicker";

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food & Dining",
  transport: "Transport",
  entertainment: "Entertainment",
  shopping: "Shopping",
  health: "Health",
  utilities: "Utilities",
  subscription: "Subscriptions",
  other: "Other",
};

export type BudgetProgressProps = {
  spent: number;
  budget: number;
  byCategory: Record<string, number>;
  categoryBudgets: Record<string, number>;
};

function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function labelForCategory(key: string): string {
  return CATEGORY_LABELS[key] ?? key.replace(/_/g, " ");
}

export function BudgetProgress({
  spent,
  budget,
  byCategory,
  categoryBudgets,
}: BudgetProgressProps) {
  const safeBudget = budget > 0 ? budget : 0;
  const remaining = Math.max(0, safeBudget - spent);
  const remainingRatio = safeBudget > 0 ? remaining / safeBudget : 0;

  let remainingClass = "text-negative";
  if (remainingRatio > 0.2) remainingClass = "text-positive";
  else if (remainingRatio >= 0.1) remainingClass = "text-warning";

  const spentPct =
    safeBudget > 0 ? Math.min(100, (spent / safeBudget) * 100) : 0;

  let barColorClass = "bg-negative";
  if (remainingRatio > 0.5) barColorClass = "bg-positive";
  else if (remainingRatio >= 0.2) barColorClass = "bg-warning";

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-24 h-24 bg-positive/[0.03] rounded-full blur-3xl -translate-x-6 -translate-y-6" />

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-text-primary">Budget</h2>
        <p className={`text-sm font-medium ${remainingClass}`}>
          <NumberTicker value={remaining} prefix="$" decimals={2} /> remaining
        </p>
      </div>
      <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-bg-tertiary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${spentPct}%` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className={`h-full rounded-full ${barColorClass}`}
        />
      </div>
      <div className="space-y-4">
        {topCategories.map(([key, catSpent], i) => {
          const catBudget = categoryBudgets[key] ?? 0;
          const catPct =
            catBudget > 0
              ? Math.min(100, (catSpent / catBudget) * 100)
              : catSpent > 0
                ? 100
                : 0;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="text-text-primary">
                  {labelForCategory(key)}{" "}
                  <span className="text-text-secondary font-[family-name:var(--font-mono)]">
                    {formatCurrency(catSpent)}
                  </span>
                </span>
                <span className="shrink-0 text-text-secondary font-[family-name:var(--font-mono)]">
                  {formatCurrency(catBudget)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${catPct}%` }}
                  transition={{ duration: 0.8, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                  className="h-full rounded-full bg-accent-blue"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
