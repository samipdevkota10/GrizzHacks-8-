"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { DollarSign } from "lucide-react";
import { getUserId, fetchCashFlowForecast, type CashFlowDay } from "@/lib/api";
import { useChartColors } from "@/lib/useChartColors";

export function CashFlowForecast() {
  const [forecast, setForecast] = useState<CashFlowDay[]>([]);
  const [dangerThreshold, setDangerThreshold] = useState(300);
  const chartColors = useChartColors();

  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;
    fetchCashFlowForecast(uid)
      .then((data) => {
        setForecast(data.forecast);
        setDangerThreshold(data.danger_zone_threshold);
      })
      .catch(() => {});
  }, []);

  if (forecast.length === 0) return null;

  const chartData = forecast.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    danger: d.balance < dangerThreshold,
  }));

  const minBalance = Math.min(...forecast.map((d) => d.balance));
  const minDay = forecast.find((d) => d.balance === minBalance);
  const events = forecast.filter((d) => d.event);

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <DollarSign size={16} className="text-primary" />
          30-Day Cash Flow Forecast
        </h3>
        {minBalance < dangerThreshold && minDay && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400">
            Low: ${minBalance.toLocaleString()} on {new Date(minDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F8EF7" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#4F8EF7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: chartColors.axis }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 10, fill: chartColors.axis }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${chartColors.tooltipBorder}`,
              fontSize: 12,
              backgroundColor: chartColors.tooltipBg,
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, "Balance"]}
          />
          <ReferenceLine
            y={dangerThreshold}
            stroke="#DC2626"
            strokeDasharray="4 4"
            label={{ value: "Danger", fill: "#DC2626", fontSize: 10, position: "right" }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#4F8EF7"
            fill="url(#cashGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      {events.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {events.slice(0, 5).map((e, i) => {
            const isIncome = e.event?.startsWith("Paycheck");
            return (
              <span
                key={i}
                className={`text-[10px] px-2 py-1 rounded-full border font-medium ${
                  isIncome
                    ? "bg-green-50 text-green-700 border-green-200/60 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: {e.event}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
