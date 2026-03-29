"use client";

import { useState } from "react";
import { ShieldAlert, Phone, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { resolveFraudAlert, type FraudAlert } from "@/lib/api";

const STATUS_CONFIG = {
  pending: {
    bg: "bg-warm border-primary/30",
    icon: ShieldAlert,
    iconColor: "text-primary",
    label: "Fraud Alert",
    labelBg: "bg-primary/10 text-primary",
  },
  calling: {
    bg: "bg-warm border-primary/20",
    icon: Phone,
    iconColor: "text-primary/80",
    label: "Vera Calling You",
    labelBg: "bg-primary/10 text-primary/80",
  },
  call_failed: {
    bg: "bg-warm border-primary/25",
    icon: ShieldAlert,
    iconColor: "text-primary/70",
    label: "Call Failed",
    labelBg: "bg-primary/10 text-primary/70",
  },
} as const;

function ActiveAlertCard({ alert, onResolved }: { alert: FraudAlert; onResolved: () => void }) {
  const [resolving, setResolving] = useState<"confirm" | "deny" | null>(null);
  const cfg = STATUS_CONFIG[alert.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  const handleResolve = async (resolution: "user_confirmed" | "user_denied") => {
    setResolving(resolution === "user_confirmed" ? "confirm" : "deny");
    try {
      await resolveFraudAlert(alert._id, resolution);
      onResolved();
    } catch {
      // ignore — poll will refresh
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className={`rounded-2xl border-2 p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 ${cfg.bg}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        {alert.status === "calling" ? (
          <Loader2 size={20} className={`${cfg.iconColor} animate-spin`} />
        ) : (
          <Icon size={20} className={cfg.iconColor} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.labelBg}`}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Risk Score: {alert.risk_score}/100
          </span>
          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
            alert.severity === "high"
              ? "bg-primary/15 text-primary"
              : "bg-secondary text-muted-foreground"
          }`}>
            {alert.severity}
          </span>
        </div>
        <p className="text-sm font-semibold text-foreground">
          Suspicious charge of ${Math.abs(alert.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} at {alert.merchant_name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.reason}</p>
        {alert.status === "calling" ? (
          <p className="text-xs text-primary/80 mt-1.5 font-medium animate-pulse">
            Vera is calling your phone now — your response on the call will be applied automatically.
          </p>
        ) : (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-muted-foreground">Was this you?</span>
            <button
              onClick={() => handleResolve("user_confirmed")}
              disabled={resolving !== null}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-foreground text-background hover:opacity-80 disabled:opacity-50 transition-colors"
            >
              {resolving === "confirm" ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
              Yes, approve
            </button>
            <button
              onClick={() => handleResolve("user_denied")}
              disabled={resolving !== null}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-border bg-secondary text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {resolving === "deny" ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
              No, block it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function FraudAlertBanner({ alerts, onResolved }: { alerts: FraudAlert[]; onResolved?: () => void }) {
  // Only show active (unresolved) alerts — resolved ones are already in the notification panel
  const active = (alerts || []).filter((a) => a.status !== "resolved");
  if (active.length === 0) return null;

  const handleResolved = () => { if (onResolved) onResolved(); };

  return (
    <div className="space-y-2">
      {active.map((alert) => (
        <ActiveAlertCard key={alert._id} alert={alert} onResolved={handleResolved} />
      ))}
    </div>
  );
}
