"use client";

import { cn } from "@/lib/formatters";

type VeraAvatarProps = {
  size?: number;
  speaking?: boolean;
  className?: string;
};

export function VeraAvatar({
  size = 200,
  speaking = false,
  className,
}: VeraAvatarProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full border-2 border-vera-primary/30",
        speaking && "animate-vera-pulse",
        className
      )}
      style={{ width: size, height: size }}
    >
      <div
        className="flex h-full w-full items-center justify-center rounded-full text-6xl font-bold text-white font-[family-name:var(--font-display)]"
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
        }}
      >
        V
      </div>
    </div>
  );
}
