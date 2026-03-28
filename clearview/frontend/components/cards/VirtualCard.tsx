"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Pause, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/formatters";
import { CardDestroyConfirm } from "./CardDestroyConfirm";

const GRADIENTS: Record<string, string> = {
  blue: "linear-gradient(135deg, #1a3a5c 0%, #0d1f3c 50%, #162d4d 100%)",
  purple: "linear-gradient(135deg, #2d1b4e 0%, #1a0f30 50%, #3d2060 100%)",
  green: "linear-gradient(135deg, #1a3c2a 0%, #0d2018 50%, #1d4030 100%)",
  red: "linear-gradient(135deg, #3c1a1a 0%, #2a0d0d 50%, #4a1e1e 100%)",
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
  index?: number;
};

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function VirtualCard({ card, onPause, onDestroy, index = 0 }: VirtualCardProps) {
  const [showDestroyConfirm, setShowDestroyConfirm] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>("idle");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

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
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className="flex flex-col gap-3"
      style={{ perspective: 800 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          background: gradient,
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative aspect-[360/226] w-full overflow-hidden rounded-2xl p-5 text-white shadow-lg cursor-pointer",
          isDestroyed && "grayscale",
          animationPhase === "shaking" && "animate-card-shake",
          animationPhase === "flashing" && "animate-card-flash",
          animationPhase === "shrinking" &&
            "scale-0 opacity-0 transition-all duration-[400ms] ease-in-out",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/[0.04] blur-2xl" />

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
              <span className="rounded-full bg-positive/20 px-2 py-0.5 text-xs text-positive backdrop-blur-sm">
                active
              </span>
            )}
            {statusLower === "paused" && (
              <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning backdrop-blur-sm">
                paused
              </span>
            )}
            {statusLower === "destroyed" && (
              <span className="rounded-full bg-negative/20 px-2 py-0.5 text-xs text-negative backdrop-blur-sm">
                destroyed
              </span>
            )}
            {!["active", "paused", "destroyed"].includes(statusLower) && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70 backdrop-blur-sm">
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
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                  className="h-full rounded-full bg-accent-blue"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {!isDestroyed && animationPhase === "idle" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.1 }}
          className="flex flex-wrap gap-2"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
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
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => setShowDestroyConfirm(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-negative transition-colors hover:bg-negative/10"
          >
            <Trash2 className="size-4 shrink-0" strokeWidth={2} />
            Destroy
          </motion.button>
        </motion.div>
      )}

      <CardDestroyConfirm
        isOpen={showDestroyConfirm}
        merchantName={card.merchant_name}
        onConfirm={handleDestroyConfirm}
        onCancel={() => setShowDestroyConfirm(false)}
      />
    </motion.div>
  );
}
