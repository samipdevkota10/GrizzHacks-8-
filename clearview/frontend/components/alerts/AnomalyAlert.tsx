"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export type AnomalyAlertItem = {
  _id: string;
  merchant_name: string;
  last_known_amount: number;
  incoming_amount: number;
  delta_pct: number;
  status: string;
};

export type AnomalyAlertProps = {
  alerts: AnomalyAlertItem[];
  onAction: (alertId: string, action: string) => void;
};

const EXIT_MS = 400;

export function AnomalyAlert({ alerts, onAction }: AnomalyAlertProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [exitingIds, setExitingIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const alertIds = new Set(alerts.map((a) => a._id));
    setDismissedIds((prev) => new Set([...prev].filter((id) => alertIds.has(id))));
  }, [alerts]);

  const visible = alerts.filter((a) => !dismissedIds.has(a._id));

  const handleAction = useCallback(
    (alertId: string, actionType: string) => {
      onAction(alertId, actionType);
      setExitingIds((prev) => new Set(prev).add(alertId));
      window.setTimeout(() => {
        setDismissedIds((prev) => new Set(prev).add(alertId));
        setExitingIds((prev) => {
          const next = new Set(prev);
          next.delete(alertId);
          return next;
        });
      }, EXIT_MS);
    },
    [onAction]
  );

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {visible.map((alert) => {
        const initial = alert.merchant_name.trim().charAt(0).toUpperCase() || "?";
        const exiting = exitingIds.has(alert._id);
        return (
          <div
            key={alert._id}
            className={`flex items-center gap-5 rounded-xl border-l-[3px] border-l-alert-border bg-alert-bg p-5 ${exiting ? "animate-slide-up-out" : ""}`}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-negative/20 text-lg font-bold text-negative"
              aria-hidden
            >
              {initial}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-text-primary">
                {alert.merchant_name} price increase detected
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="text-text-secondary">
                    ${alert.last_known_amount.toFixed(2)}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
                  <span className="font-semibold text-negative">
                    ${alert.incoming_amount.toFixed(2)}
                  </span>
                </span>
                <span className="inline-flex rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning">
                  +{alert.delta_pct}%
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-positive/40 px-3 py-1.5 text-sm font-medium text-positive transition-colors duration-200 hover:bg-positive/10"
                onClick={() => handleAction(alert._id, "approve_once")}
              >
                Approve Once
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-accent-blue/40 px-3 py-1.5 text-sm font-medium text-accent-blue transition-colors duration-200 hover:bg-accent-blue/10"
                onClick={() => handleAction(alert._id, "approve_update_limit")}
              >
                Update Limit
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-lg bg-negative px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-negative/80"
                onClick={() => handleAction(alert._id, "decline_pause")}
              >
                Decline &amp; Pause
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
