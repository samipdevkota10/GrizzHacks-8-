"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "motion/react";

type NumberTickerProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
};

export function NumberTicker({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  duration = 1.4,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.21, 0.47, 0.32, 0.98],
      onUpdate(latest) {
        setDisplayed(latest);
      },
    });
    return () => controls.stop();
  }, [isInView, value, duration]);

  const formatted = displayed.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
