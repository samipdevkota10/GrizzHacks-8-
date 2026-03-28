"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export type NetWorthCardProps = {
  netWorth: number;
  monthlyChange: number;
  assets: number;
  liabilities: number;
  monthlyData?: { month: string; value: number }[];
};

export function NetWorthCard({
  netWorth,
  monthlyChange,
  assets,
  liabilities,
  monthlyData,
}: NetWorthCardProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const step = (ts: number) => {
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(netWorth * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [netWorth]);

  const changePositive = monthlyChange >= 0;
  const changeAbs = Math.abs(monthlyChange);
  const changeLabel = `${changePositive ? "+" : "-"}$${changeAbs.toLocaleString()} this month`;

  const sparkData =
    monthlyData && monthlyData.length > 0
      ? monthlyData.slice(-6)
      : undefined;

  return (
    <div className="glass-card p-6">
      <p className="text-sm font-medium uppercase tracking-wider text-text-secondary">
        Net Worth
      </p>
      <p
        className="mt-2 text-5xl font-bold text-text-primary font-[family-name:var(--font-display)]"
        aria-live="polite"
      >
        ${displayed.toLocaleString()}
      </p>

      <div
        className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${
          changePositive ? "text-positive" : "text-negative"
        }`}
      >
        {changePositive ? (
          <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <TrendingDown className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span>{changeLabel}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-bg-secondary/60 px-3 py-2.5">
          <p className="text-xs uppercase tracking-wide text-text-secondary">
            Assets
          </p>
          <p className="mt-0.5 text-sm font-semibold text-positive">
            ${assets.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-bg-secondary/60 px-3 py-2.5">
          <p className="text-xs uppercase tracking-wide text-text-secondary">
            Liabilities
          </p>
          <p className="mt-0.5 text-sm font-semibold text-negative">
            ${liabilities.toLocaleString()}
          </p>
        </div>
      </div>

      {sparkData && sparkData.length > 0 ? (
        <div className="mt-4 h-10 w-full">
          <ResponsiveContainer width="100%" height={40}>
            <LineChart
              data={sparkData}
              margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
            >
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-accent-blue)"
                strokeWidth={1.5}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}
