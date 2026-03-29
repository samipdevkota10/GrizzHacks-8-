"use client";

import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import type { DailySnapshot } from "@/lib/api";

const STATUS_CONFIG = {
  on_track: {
    bg: "bg-secondary border-border",
    iconBg: "bg-muted",
    icon: CheckCircle2,
    iconColor: "text-foreground",
  },
  watch: {
    bg: "bg-warm border-border dark:bg-warm dark:border-border",
    iconBg: "bg-light-accent dark:bg-light-accent",
    icon: Eye,
    iconColor: "text-primary",
  },
  at_risk: {
    bg: "bg-warm border-primary/20 dark:bg-warm dark:border-primary/30",
    iconBg: "bg-primary/10 dark:bg-primary/20",
    icon: AlertTriangle,
    iconColor: "text-primary",
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
          <p className={`text-sm font-bold tabular-nums flex items-center gap-1 ${snapshot.net_worth_delta_30d >= 0 ? "text-foreground" : "text-primary"}`}>
            {snapshot.net_worth_delta_30d >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {snapshot.net_worth_delta_30d >= 0 ? "+" : ""}${Math.abs(snapshot.net_worth_delta_30d).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
