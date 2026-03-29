"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
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

/** Play a brief, subtle alert tone using Web Audio API */
function playAlertTone() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // Web Audio not available — silent fallback
  }
}

function ActiveAlertCard({ alert, onResolved, isNew }: { alert: FraudAlert; onResolved: () => void; isNew: boolean }) {
  const [resolving, setResolving] = useState<"confirm" | "deny" | null>(null);
  const [pulseBorder, setPulseBorder] = useState(isNew);
  const cfg = STATUS_CONFIG[alert.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  useEffect(() => {
    if (isNew) {
      playAlertTone();
      const t = setTimeout(() => setPulseBorder(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isNew]);

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
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`rounded-2xl border-2 p-4 flex items-start gap-4 transition-shadow duration-500 ${cfg.bg} ${
        pulseBorder ? "shadow-[0_0_0_3px_rgba(232,115,74,0.25)]" : ""
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        {alert.status === "calling" ? (
          <Loader2 size={20} className={`${cfg.iconColor} animate-spin`} />
        ) : (
          <motion.div
            animate={pulseBorder ? { scale: [1, 1.25, 1] } : {}}
            transition={{ repeat: 3, duration: 0.4 }}
          >
            <Icon size={20} className={cfg.iconColor} />
          </motion.div>
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
    </motion.div>
  );
}

export function FraudAlertBanner({ alerts, onResolved }: { alerts: FraudAlert[]; onResolved?: () => void }) {
  const active = (alerts || []).filter((a) => a.status !== "resolved");
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(active.map((a) => a._id));
    const justAppeared = new Set<string>();
    currentIds.forEach((id) => {
      if (!prevIdsRef.current.has(id)) justAppeared.add(id);
    });
    if (justAppeared.size > 0) setNewIds(justAppeared);
    prevIdsRef.current = currentIds;
  }, [active]);

  if (active.length === 0) return null;

  const handleResolved = () => { if (onResolved) onResolved(); };

  return (
    <AnimatePresence mode="popLayout">
      <div className="space-y-2">
        {active.map((alert) => (
          <ActiveAlertCard
            key={alert._id}
            alert={alert}
            onResolved={handleResolved}
            isNew={newIds.has(alert._id)}
          />
        ))}
      </div>
    </AnimatePresence>
  );
}
