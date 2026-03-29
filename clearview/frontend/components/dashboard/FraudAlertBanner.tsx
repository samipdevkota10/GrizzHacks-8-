"use client";

import { useState } from "react";
import { ShieldAlert, ShieldOff, ShieldCheck, Phone, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { resolveFraudAlert, type FraudAlert } from "@/lib/api";

const STATUS_CONFIG = {
  pending: {
    bg: "bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800/50",
    icon: ShieldAlert,
    iconColor: "text-red-600 dark:text-red-400",
    label: "Fraud Alert",
    labelBg: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  },
  calling: {
    bg: "bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800/50",
    icon: Phone,
    iconColor: "text-amber-600 dark:text-amber-400",
    label: "Vera Calling You",
    labelBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  call_failed: {
    bg: "bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800/50",
    icon: ShieldAlert,
    iconColor: "text-orange-600 dark:text-orange-400",
    label: "Call Failed",
    labelBg: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  },
  resolved: {
    bg: "bg-muted border-border",
    icon: ShieldCheck,
    iconColor: "text-muted-foreground",
    label: "Resolved",
    labelBg: "bg-muted text-muted-foreground",
  },
} as const;

function ResolutionBadge({ resolution }: { resolution?: string | null }) {
  if (resolution === "user_denied")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800/40">
        <ShieldOff size={12} /> BLOCKED
      </span>
    );
  if (resolution === "user_confirmed")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-800/40">
        <ShieldCheck size={12} /> APPROVED
      </span>
    );
  if (resolution === "no_answer")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border border-gray-200 dark:border-gray-700/40">
        No Answer
      </span>
    );
  return null;
}

function ActiveAlertCard({ alert, onResolved }: { alert: FraudAlert; onResolved: () => void }) {
  const [resolving, setResolving] = useState<"confirm" | "deny" | null>(null);
  const cfg = STATUS_CONFIG[alert.status] || STATUS_CONFIG.pending;
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
              ? "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300"
              : "bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
          }`}>
            {alert.severity}
          </span>
        </div>
        <p className="text-sm font-semibold text-foreground">
          Suspicious charge of ${Math.abs(alert.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} at {alert.merchant_name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.reason}</p>
        {alert.status === "calling" && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium animate-pulse">
            Vera is calling your phone now to verify this charge...
          </p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] text-muted-foreground">Was this you?</span>
          <button
            onClick={() => handleResolve("user_confirmed")}
            disabled={resolving !== null}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {resolving === "confirm" ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
            Yes, approve
          </button>
          <button
            onClick={() => handleResolve("user_denied")}
            disabled={resolving !== null}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {resolving === "deny" ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
            No, block it
          </button>
        </div>
      </div>
    </div>
  );
}

export function FraudAlertBanner({ alerts, onResolved }: { alerts: FraudAlert[]; onResolved?: () => void }) {
  if (!alerts || alerts.length === 0) return null;

  const active = alerts.filter((a) => a.status !== "resolved");
  const resolved = alerts.filter((a) => a.status === "resolved");

  const handleResolved = () => {
    if (onResolved) onResolved();
  };

  return (
    <div className="space-y-2">
      {active.map((alert) => (
        <ActiveAlertCard key={alert._id} alert={alert} onResolved={handleResolved} />
      ))}

      {resolved.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Recent Fraud Resolutions
          </h4>
          <div className="space-y-2">
            {resolved.slice(0, 3).map((alert) => (
              <div key={alert._id} className="flex items-center gap-3 text-sm">
                <ResolutionBadge resolution={alert.resolution} />
                <span className="text-muted-foreground truncate">
                  ${Math.abs(alert.amount).toFixed(2)} at {alert.merchant_name}
                </span>
                {alert.call_resolved_at && (
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(alert.call_resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
