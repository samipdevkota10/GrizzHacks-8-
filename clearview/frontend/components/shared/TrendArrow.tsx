"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

export type TrendArrowProps = {
  value: number;
  label?: string;
};

function formatMoney(value: number) {
  return Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function TrendArrow({ value, label }: TrendArrowProps) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-text-secondary">
        <span>—</span>
        {label ? <span className="text-sm text-text-secondary">{label}</span> : null}
      </span>
    );
  }

  const isUp = value > 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  const textClass = isUp ? "text-positive" : "text-negative";
  const amountStr = `${isUp ? "+" : "-"}$${formatMoney(value)}`;

  return (
    <span className={`inline-flex items-center gap-1.5 ${textClass}`}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span>{amountStr}</span>
      {label ? <span className="text-sm text-text-secondary">{label}</span> : null}
    </span>
  );
}
