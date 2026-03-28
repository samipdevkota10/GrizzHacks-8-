"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { NumberTicker } from "@/components/motion/NumberTicker";

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
  const changePositive = monthlyChange >= 0;
  const changeAbs = Math.abs(monthlyChange);
  const changeLabel = `${changePositive ? "+" : "-"}$${changeAbs.toLocaleString()} this month`;

  const sparkData =
    monthlyData && monthlyData.length > 0
      ? monthlyData.slice(-6)
      : undefined;

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/[0.04] rounded-full blur-3xl translate-x-8 -translate-y-8" />

      <p className="text-sm font-medium uppercase tracking-wider text-text-secondary">
        Net Worth
      </p>
      <p
        className="mt-2 text-5xl font-bold text-text-primary font-[family-name:var(--font-display)]"
        aria-live="polite"
      >
        <NumberTicker value={netWorth} prefix="$" duration={1.6} />
      </p>

      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
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
      </motion.div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-xl bg-bg-secondary/60 px-3 py-2.5 ring-1 ring-white/[0.04]"
        >
          <p className="text-xs uppercase tracking-wide text-text-secondary">
            Assets
          </p>
          <p className="mt-0.5 text-sm font-semibold text-positive">
            <NumberTicker value={assets} prefix="$" duration={1.4} />
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-xl bg-bg-secondary/60 px-3 py-2.5 ring-1 ring-white/[0.04]"
        >
          <p className="text-xs uppercase tracking-wide text-text-secondary">
            Liabilities
          </p>
          <p className="mt-0.5 text-sm font-semibold text-negative">
            <NumberTicker value={liabilities} prefix="$" duration={1.4} />
          </p>
        </motion.div>
      </div>

      {sparkData && sparkData.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          style={{ transformOrigin: "left" }}
          className="mt-4 h-10 w-full"
        >
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
        </motion.div>
      ) : null}
    </div>
  );
}
