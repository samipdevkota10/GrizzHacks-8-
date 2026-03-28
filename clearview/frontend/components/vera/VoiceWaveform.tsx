"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/formatters";

type VoiceWaveformProps = {
  active?: boolean;
  className?: string;
};

const bars = [0, 1, 2, 3, 4];

export function VoiceWaveform({ active = false, className }: VoiceWaveformProps) {
  const [, setFrame] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => {
      setFrame((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div className={cn("flex items-center gap-1 h-8", className)}>
      {bars.map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-vera-primary transition-all duration-300"
          style={{
            height: active
              ? `${12 + Math.sin(Date.now() / 300 + i) * 8}px`
              : "8px",
            animation: active
              ? `waveform 1.2s ease-in-out ${i * 0.15}s infinite`
              : "none",
          }}
        />
      ))}
    </div>
  );
}
