"use client";

import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import type { DailySnapshot } from "@/lib/api";

const STATUS_CONFIG = {
  on_track: {
    bg: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/40",
    iconBg: "bg-green-100 dark:bg-green-900/40",
    icon: CheckCircle2,
    iconColor: "text-green-600 dark:text-green-400",
  },
  watch: {
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    icon: Eye,
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  at_risk: {
    bg: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    icon: AlertTriangle,
    iconColor: "text-red-600 dark:text-red-400",
  },
} as const;

export function DailySnapshotBanner({ snapshot }: { snapshot: DailySnapshot }) {
  const config = STATUS_CONFIG[snapshot.status];
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-4 ${config.bg}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.iconBg}`}>
        <Icon size={20} className={config.iconColor} />
      </div>
      <p className="text-sm font-medium text-foreground flex-1">{snapshot.message}</p>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Net Worth 30d</p>
          <p className={`text-sm font-bold tabular-nums flex items-center gap-1 ${snapshot.net_worth_delta_30d >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
            {snapshot.net_worth_delta_30d >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {snapshot.net_worth_delta_30d >= 0 ? "+" : ""}${Math.abs(snapshot.net_worth_delta_30d).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
