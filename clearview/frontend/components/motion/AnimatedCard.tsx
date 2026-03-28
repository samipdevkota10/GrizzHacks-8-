"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";

type AnimatedCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  index?: number;
};

export function AnimatedCard({ children, className = "", delay = 0, index = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: delay + index * 0.08,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      whileHover={{
        y: -4,
        scale: 1.015,
        transition: { duration: 0.25, ease: "easeOut" },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
