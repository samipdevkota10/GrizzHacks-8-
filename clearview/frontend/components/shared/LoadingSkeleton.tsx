"use client";

import { cn } from "@/lib/formatters";

export type LoadingSkeletonProps = {
  className?: string;
};

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-shimmer rounded-xl", className)} aria-hidden />
  );
}
