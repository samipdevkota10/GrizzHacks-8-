"use client";

import { Phone } from "lucide-react";
import { cn } from "@/lib/formatters";

type VeraCallButtonProps = {
  onClick: () => void;
  className?: string;
};

export function VeraCallButton({ onClick, className }: VeraCallButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-vera-primary/40 bg-vera-primary/20 py-3 text-vera-primary animate-vera-pulse font-medium transition-colors duration-200 hover:bg-vera-primary/30",
        className
      )}
    >
      <Phone className="h-5 w-5 shrink-0" aria-hidden />
      Call Vera
    </button>
  );
}
