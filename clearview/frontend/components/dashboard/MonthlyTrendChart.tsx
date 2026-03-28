"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type MonthlyTrendChartProps = {
  data: { month: string; spending: number; income: number }[];
};

const tooltipStyle = {
  backgroundColor: "var(--color-bg-secondary)",
  border: "1px solid var(--color-border-subtle)",
  borderRadius: "0.5rem",
  color: "var(--color-text-primary)",
};

function formatDollars(value: number) {
  return `$${Number(value).toLocaleString()}`;
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-text-primary">
        Monthly Trend
      </h3>

      <div className="mt-4 h-[250px] w-full cursor-pointer">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatDollars(Number(v))}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "var(--color-text-secondary)" }}
              formatter={(value: number | string, name: string) => [
                formatDollars(Number(value)),
                name === "spending" ? "Spending" : "Income",
              ]}
              cursor={{ stroke: "rgba(255,255,255,0.12)" }}
            />
            <Area
              type="monotone"
              dataKey="spending"
              name="spending"
              stroke="#FF4757"
              fill="#FF4757"
              fillOpacity={0.2}
              strokeWidth={2}
              isAnimationActive
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="income"
              name="income"
              stroke="#00D26A"
              fill="#00D26A"
              fillOpacity={0.2}
              strokeWidth={2}
              isAnimationActive
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
