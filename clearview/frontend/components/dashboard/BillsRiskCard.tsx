"use client";

import { ShieldCheck, ShieldAlert, ShieldX, Calendar } from "lucide-react";
import type { BillRisk } from "@/lib/api";

const RISK_CONFIG = {
  safe: {
    icon: ShieldCheck,
    iconColor: "text-foreground",
    label: "All Clear",
    labelStyle: "text-foreground bg-secondary",
  },
  watch: {
    icon: ShieldAlert,
    iconColor: "text-primary",
    label: "Watch",
    labelStyle: "text-primary bg-warm dark:bg-warm",
  },
  critical: {
    icon: ShieldX,
    iconColor: "text-primary",
    label: "At Risk",
    labelStyle: "text-primary bg-warm dark:bg-warm",
  },
} as const;

export function BillsRiskCard({ risk }: { risk: BillRisk }) {
  const config = RISK_CONFIG[risk.risk_level];
  const Icon = config.icon;

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          Bills Outlook
        </h3>
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${config.labelStyle}`}>
          <Icon size={12} className="inline mr-1" />{config.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Next 7 Days</p>
          <p className="text-lg font-bold text-foreground tabular-nums">${risk.due_7d_total.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">14 Days</p>
          <p className="text-lg font-bold text-foreground tabular-nums">${risk.due_14d_total.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">30 Days</p>
          <p className="text-lg font-bold text-foreground tabular-nums">${risk.due_30d_total.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
        <span className="text-xs text-muted-foreground">Checking buffer after 30d bills</span>
        <span className={`text-sm font-bold tabular-nums ${risk.checking_buffer_after_30d < 0 ? "text-primary" : "text-foreground"}`}>
          {risk.checking_buffer_after_30d < 0 ? "-" : ""}${Math.abs(risk.checking_buffer_after_30d).toLocaleString()}
        </span>
      </div>

      {risk.at_risk_bills.length > 0 && (
        <div className="mt-3 space-y-1">
          {risk.at_risk_bills.map((bill) => (
            <div key={`${bill.name}-${bill.date}`} className="flex justify-between items-center text-xs py-1.5">
              <span className="text-muted-foreground">{bill.name}</span>
              <span className="font-medium text-foreground tabular-nums">${bill.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
