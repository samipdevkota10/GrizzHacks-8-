"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";

type StaggerContainerProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (custom: { staggerDelay: number; initialDelay: number }) => ({
    opacity: 1,
    transition: {
      delayChildren: custom.initialDelay,
      staggerChildren: custom.staggerDelay,
    },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.21, 0.47, 0.32, 0.98] as const,
    },
  },
};

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.08,
  initialDelay = 0.1,
}: StaggerContainerProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      custom={{ staggerDelay, initialDelay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
