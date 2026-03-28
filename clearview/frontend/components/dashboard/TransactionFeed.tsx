"use client";

import Link from "next/link";
import { motion } from "motion/react";

export type TransactionFeedItem = {
  _id: string;
  merchant_name: string;
  category: string;
  amount: number;
  date: string;
  anomaly_flag: boolean;
  is_recurring: boolean;
};

export type TransactionFeedProps = {
  transactions: TransactionFeedItem[];
};

function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function TransactionFeed({ transactions }: TransactionFeedProps) {
  const visible = transactions.slice(0, 10);

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Recent Transactions
        </h2>
        <Link
          href="/transactions"
          className="text-sm text-accent-blue transition-colors hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="max-h-[min(28rem,60vh)] overflow-y-auto pr-1">
        <ul>
          {visible.map((tx, i) => {
            const initial = tx.merchant_name.trim().charAt(0).toUpperCase() || "?";
            const amountClass =
              tx.amount < 0 ? "text-negative" : "text-positive";

            return (
              <motion.li
                key={tx._id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.4 + i * 0.04,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="border-b border-border-subtle last:border-b-0"
              >
                <motion.div
                  whileHover={{ x: 4, backgroundColor: "rgba(20, 31, 53, 0.5)" }}
                  transition={{ duration: 0.2 }}
                  className={`flex cursor-pointer items-center gap-4 py-3 rounded-lg transition-colors duration-200 ${
                    tx.anomaly_flag ? "bg-[rgba(255,71,87,0.08)]" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${tx.anomaly_flag ? "bg-negative" : "bg-transparent"}`}
                    aria-hidden={!tx.anomaly_flag}
                    title={tx.anomaly_flag ? "Unusual activity" : undefined}
                  />
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-tertiary font-medium text-text-primary ring-1 ring-white/[0.04]">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text-primary">
                      {tx.merchant_name}
                    </p>
                    <p className="text-xs text-text-secondary">{tx.category}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-medium font-[family-name:var(--font-mono)] ${amountClass}`}>
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatShortDate(tx.date)}
                    </p>
                  </div>
                </motion.div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
