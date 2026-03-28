"use client";

import { Calendar, ShoppingBag, TrendingDown } from "lucide-react";

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

export type QuickStatsProps = {
  avgDailySpend: number;
  topCategory: string;
  topCategoryAmount: number;
  daysUntilPaycheck: number;
};

function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function categoryLabel(key: string): string {
  return CATEGORY_LABELS[key.toLowerCase()] ?? key;
}

export function QuickStats({
  avgDailySpend,
  topCategory,
  topCategoryAmount,
  daysUntilPaycheck,
}: QuickStatsProps) {
  return (
    <div className="flex gap-4">
      <div className="glass-card flex flex-1 gap-3 p-4">
        <TrendingDown
          className="size-5 shrink-0 text-accent-blue"
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            Avg Daily Spend
          </p>
          <p className="font-[family-name:var(--font-display)] text-xl font-bold text-text-primary">
            {formatCurrency(avgDailySpend)}
          </p>
        </div>
      </div>
      <div className="glass-card flex flex-1 gap-3 p-4">
        <ShoppingBag
          className="size-5 shrink-0 text-accent-blue"
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            Top Category
          </p>
          <p className="font-[family-name:var(--font-display)] text-xl font-bold text-text-primary">
            {categoryLabel(topCategory)} {formatCurrency(topCategoryAmount)}
          </p>
        </div>
      </div>
      <div className="glass-card flex flex-1 gap-3 p-4">
        <Calendar
          className="size-5 shrink-0 text-accent-blue"
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            Days to Paycheck
          </p>
          <p className="font-[family-name:var(--font-display)] text-xl font-bold text-text-primary">
            {daysUntilPaycheck} days
          </p>
        </div>
      </div>
    </div>
  );
}
