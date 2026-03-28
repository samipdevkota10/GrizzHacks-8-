"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/formatters";
import { CardDestroyConfirm } from "./CardDestroyConfirm";

const GRADIENTS: Record<string, string> = {
  blue: "linear-gradient(135deg, #1a3a5c, #0d1f3c)",
  purple: "linear-gradient(135deg, #2d1b4e, #1a0f30)",
  green: "linear-gradient(135deg, #1a3c2a, #0d2018)",
  red: "linear-gradient(135deg, #3c1a1a, #2a0d0d)",
};

export type VirtualCardRecord = {
  _id: string;
  nickname: string;
  merchant_name: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  status: string;
  spending_limit_monthly: number;
  spent_this_month: number;
  color_scheme: string;
  total_charged_lifetime: number;
};

type AnimationPhase = "idle" | "shaking" | "flashing" | "shrinking" | "done";

export type VirtualCardProps = {
  card: VirtualCardRecord;
  onPause: (id: string) => void;
  onDestroy: (id: string) => void;
};

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function VirtualCard({ card, onPause, onDestroy }: VirtualCardProps) {
  const [showDestroyConfirm, setShowDestroyConfirm] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>("idle");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const statusLower = card.status.toLowerCase();
  const isDestroyed = statusLower === "destroyed";
  const gradient =
    GRADIENTS[card.color_scheme.toLowerCase()] ?? GRADIENTS.blue;

  const limit = Math.max(card.spending_limit_monthly, 0);
  const spent = Math.max(card.spent_this_month, 0);
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

  const expMonth = String(card.exp_month).padStart(2, "0");

  const runDestroyAnimation = useCallback(() => {
    clearTimers();
    setAnimationPhase("shaking");
    timersRef.current.push(
      setTimeout(() => setAnimationPhase("flashing"), 300),
    );
    timersRef.current.push(
      setTimeout(() => setAnimationPhase("shrinking"), 400),
    );
    timersRef.current.push(
      setTimeout(() => {
        setAnimationPhase("done");
        onDestroy(card._id);
        clearTimers();
      }, 800),
    );
  }, [card._id, clearTimers, onDestroy]);

  const handleDestroyConfirm = useCallback(() => {
    setShowDestroyConfirm(false);
    runDestroyAnimation();
  }, [runDestroyAnimation]);

  if (animationPhase === "done") {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "relative aspect-[360/226] w-full overflow-hidden rounded-2xl p-5 text-white shadow-lg",
          isDestroyed && "grayscale",
          animationPhase === "shaking" && "animate-card-shake",
          animationPhase === "flashing" && "animate-card-flash",
          animationPhase === "shrinking" &&
            "scale-0 opacity-0 transition-all duration-[400ms] ease-in-out",
        )}
        style={{ background: gradient }}
      >
        {isDestroyed && (
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] text-6xl font-bold uppercase text-white/20"
            aria-hidden
          >
            VOID
          </span>
        )}

        <div className="relative z-[1] flex h-full flex-col">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-white/95">
              {card.merchant_name}
            </p>
            {statusLower === "active" && (
              <span className="rounded-full bg-positive/20 px-2 py-0.5 text-xs text-positive">
                active
              </span>
            )}
            {statusLower === "paused" && (
              <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">
                paused
              </span>
            )}
            {statusLower === "destroyed" && (
              <span className="rounded-full bg-negative/20 px-2 py-0.5 text-xs text-negative">
                destroyed
              </span>
            )}
            {!["active", "paused", "destroyed"].includes(statusLower) && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
                {card.status}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-center py-2">
            <p
              className="font-[family-name:var(--font-mono)] text-lg tracking-[0.15em] text-white/95"
              aria-label={`Card ending ${card.last4}`}
            >
              •••• •••• •••• {card.last4}
            </p>
          </div>

          <div className="mt-auto space-y-2">
            <p className="font-[family-name:var(--font-mono)] text-xs text-white/60">
              VALID THRU {expMonth}/{card.exp_year}
            </p>
            <div className="space-y-1">
              <p className="text-xs text-white/70">
                {formatUsd(spent)} / {formatUsd(limit)}
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-accent-blue transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isDestroyed && animationPhase === "idle" && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onPause(card._id)}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-warning transition-colors hover:bg-warning/10"
          >
            {statusLower === "paused" ? (
              <Play className="size-4 shrink-0" strokeWidth={2} />
            ) : (
              <Pause className="size-4 shrink-0" strokeWidth={2} />
            )}
            {statusLower === "paused" ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => setShowDestroyConfirm(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-negative transition-colors hover:bg-negative/10"
          >
            <Trash2 className="size-4 shrink-0" strokeWidth={2} />
            Destroy
          </button>
        </div>
      )}

      <CardDestroyConfirm
        isOpen={showDestroyConfirm}
        merchantName={card.merchant_name}
        onConfirm={handleDestroyConfirm}
        onCancel={() => setShowDestroyConfirm(false)}
      />
    </div>
  );
}
