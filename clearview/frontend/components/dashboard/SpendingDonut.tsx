"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export const CATEGORY_COLORS: Record<string, string> = {
  food: "#FF6B6B",
  transport: "#4ECDC4",
  entertainment: "#A78BFA",
  shopping: "#F7DC6F",
  health: "#00D26A",
  utilities: "#45B7D1",
  subscription: "#FF8C42",
  other: "#8B9CB6",
};

export type SpendingDonutProps = {
  data: { category: string; amount: number; color: string }[];
};

export function SpendingDonut({ data }: SpendingDonutProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => {
        const key = d.category.toLowerCase();
        const fill =
          d.color ||
          CATEGORY_COLORS[key] ||
          CATEGORY_COLORS.other;
        return { ...d, fill };
      }),
    [data],
  );

  const total = useMemo(
    () => chartData.reduce((sum, d) => sum + d.amount, 0),
    [chartData],
  );

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-text-primary">
        Spending Breakdown
      </h3>

      <div className="relative mx-auto mt-4 h-[220px] w-full max-w-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive
              animationDuration={600}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${entry.category}-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            Total
          </p>
          <p className="mt-0.5 text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">
            ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {chartData.map((item) => (
          <button
            key={item.category}
            type="button"
            className="flex cursor-pointer items-center gap-2 rounded-lg py-1 text-left transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.fill }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-text-secondary">
                {item.category}
              </span>
              <span className="text-sm font-medium text-text-primary">
                ${item.amount.toLocaleString()}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
