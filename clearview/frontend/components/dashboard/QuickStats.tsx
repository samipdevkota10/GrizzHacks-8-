"use client";

import { Calendar, ShoppingBag, TrendingDown } from "lucide-react";
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

export type QuickStatsProps = {
  avgDailySpend: number;
  topCategory: string;
  topCategoryAmount: number;
  daysUntilPaycheck: number;
};

function categoryLabel(key: string): string {
  return CATEGORY_LABELS[key.toLowerCase()] ?? key;
}

const stats = [
  { key: "daily", icon: TrendingDown },
  { key: "top", icon: ShoppingBag },
  { key: "payday", icon: Calendar },
] as const;

export function QuickStats({
  avgDailySpend,
  topCategory,
  topCategoryAmount,
  daysUntilPaycheck,
}: QuickStatsProps) {
  const items = [
    {
      label: "Avg Daily Spend",
      value: <NumberTicker value={avgDailySpend} prefix="$" decimals={2} />,
      icon: stats[0].icon,
    },
    {
      label: "Top Category",
      value: (
        <>
          {categoryLabel(topCategory)}{" "}
          <NumberTicker value={topCategoryAmount} prefix="$" decimals={2} />
        </>
      ),
      icon: stats[1].icon,
    },
    {
      label: "Days to Paycheck",
      value: (
        <>
          <NumberTicker value={daysUntilPaycheck} /> days
        </>
      ),
      icon: stats[2].icon,
    },
  ];

  return (
    <div className="flex gap-4">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: i * 0.08,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            whileHover={{ y: -2, scale: 1.01 }}
            className="glass-card flex flex-1 gap-3 p-4"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10">
              <Icon
                className="size-5 text-accent-blue"
                strokeWidth={2}
                aria-hidden
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                {item.label}
              </p>
              <p className="font-[family-name:var(--font-display)] text-xl font-bold text-text-primary">
                {item.value}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
