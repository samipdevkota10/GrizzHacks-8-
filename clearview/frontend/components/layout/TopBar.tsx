"use client";

import { motion } from "motion/react";
import { Bell, Search } from "lucide-react";

type TopBarProps = {
  title: string;
  alertCount?: number;
};

export function TopBar({ title, alertCount = 0 }: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border-subtle/50">
      <motion.h1
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="font-[family-name:var(--font-display)] text-2xl font-bold text-text-primary"
      >
        {title}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          type="button"
          className="relative flex cursor-pointer items-center justify-center rounded-xl p-2.5 text-text-secondary transition-colors duration-200 hover:bg-bg-tertiary hover:text-text-primary"
          aria-label={`Notifications${alertCount > 0 ? `, ${alertCount} unread` : ""}`}
        >
          <Bell className="size-5" strokeWidth={2} />
          {alertCount > 0 ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-negative text-[10px] font-bold leading-none text-white"
            >
              {alertCount > 99 ? "99+" : alertCount}
            </motion.span>
          ) : null}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          type="button"
          className="flex cursor-pointer items-center justify-center rounded-xl p-2.5 text-text-secondary transition-colors duration-200 hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Search"
        >
          <Search className="size-5" strokeWidth={2} />
        </motion.button>
      </motion.div>
    </header>
  );
}
