"use client";

import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

type Verdict = "yes" | "careful" | "no";

interface PurchaseResultProps {
  product: string;
  price: number;
  verdict: Verdict;
  reasoning: string;
  onDismiss: () => void;
}

const verdictConfig = {
  yes: {
    border: "border-positive/40",
    bg: "bg-positive/5",
    label: "YES — Go for it",
    textClass: "text-positive",
    Icon: CheckCircle,
  },
  careful: {
    border: "border-warning/40",
    bg: "bg-warning/5",
    label: "HOLD OFF — Think twice",
    textClass: "text-warning",
    Icon: AlertTriangle,
  },
  no: {
    border: "border-negative/40",
    bg: "bg-negative/5",
    label: "NO — Not right now",
    textClass: "text-negative",
    Icon: XCircle,
  },
} as const;

export function PurchaseResult({
  product,
  price,
  verdict,
  reasoning,
  onDismiss,
}: PurchaseResultProps) {
  const cfg = verdictConfig[verdict];
  const { Icon } = cfg;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

  return (
    <div
      className={`rounded-2xl border p-5 ${cfg.border} ${cfg.bg}`}
      role="region"
      aria-label="Purchase analysis result"
    >
      <div className="mb-3 flex items-start gap-3">
        <Icon className={`h-8 w-8 shrink-0 ${cfg.textClass}`} aria-hidden />
        <p className={`font-display text-xl font-semibold leading-tight ${cfg.textClass}`}>
          {cfg.label}
        </p>
      </div>
      <p className="mb-3 font-medium text-text-primary">
        {product} — {formatted}
      </p>
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">{reasoning}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="cursor-pointer text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        Dismiss
      </button>
    </div>
  );
}
