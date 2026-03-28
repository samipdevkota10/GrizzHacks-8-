"use client";

import { twMerge } from "tailwind-merge";

export type CurrencyDisplayProps = {
  amount: number;
  className?: string;
  showSign?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClasses: Record<NonNullable<CurrencyDisplayProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg font-[family-name:var(--font-display)]",
  xl: "text-2xl font-[family-name:var(--font-display)]",
};

export function CurrencyDisplay({
  amount,
  className,
  showSign = false,
  size = "md",
}: CurrencyDisplayProps) {
  const formatted = `$${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const signPrefix =
    showSign && amount !== 0 ? (amount > 0 ? "+" : "-") : showSign && amount === 0 ? "" : "";

  const colorClass =
    showSign && amount > 0
      ? "text-positive"
      : showSign && amount < 0
        ? "text-negative"
        : "";

  return (
    <span className={twMerge(sizeClasses[size], colorClass, className)}>
      {signPrefix}
      {formatted}
    </span>
  );
}
