"use client";

import { ShieldCheck, ShieldOff, Phone, Shield } from "lucide-react";
import type { FraudAlert } from "@/lib/api";

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function resolutionLabel(alert: FraudAlert): string {
  if (alert.resolution === "user_denied") return "Blocked via phone call";
  if (alert.resolution === "user_confirmed") return "Approved via phone call";
  if (alert.resolution === "no_answer") return "Auto-blocked — no answer";
  return "Resolved by Vera";
}

export function VeraActivityCard({ alerts }: { alerts: FraudAlert[] }) {
  const resolved = alerts.filter((a) => a.status === "resolved").slice(0, 5);
  if (resolved.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield size={14} className="text-primary" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Vera Activity</h3>
        <span className="ml-auto text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {resolved.length} resolved
        </span>
      </div>

      <div className="relative">
        {/* Timeline vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

        <div className="space-y-4">
          {resolved.map((alert, i) => {
            const denied = alert.resolution === "user_denied" || alert.resolution === "no_answer";
            return (
              <div key={alert._id} className="flex items-start gap-4">
                {/* Timeline dot */}
                <div className={`relative z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  denied ? "bg-secondary border border-border" : "bg-primary/10 border border-primary/20"
                }`}>
                  {denied
                    ? <ShieldOff size={13} className="text-muted-foreground" />
                    : <ShieldCheck size={13} className="text-primary" />
                  }
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {denied ? "Blocked" : "Approved"}{" "}
                        <span className="font-bold">${Math.abs(alert.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        {" "}at{" "}
                        <span className="text-muted-foreground font-normal">{alert.merchant_name}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Phone size={10} className="text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">{resolutionLabel(alert)}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                      {timeAgo(alert.call_resolved_at || alert.created_at)}
                    </span>
                  </div>
                  {i < resolved.length - 1 && (
                    <div className="mt-3 border-b border-border/50" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
