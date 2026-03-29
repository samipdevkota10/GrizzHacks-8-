"use client";

import { useEffect, useState } from "react";
import { CreditCard, TrendingUp, Zap } from "lucide-react";
import { getUserId, fetchWeeklyDigest } from "@/lib/api";

interface DigestDetail {
  category: string;
  spent: number;
  transaction_count: number;
  best_card: string;
  best_pct: number;
  potential_cashback: number;
}

interface Digest {
  missed_rewards: number;
  details: DigestDetail[];
  total_spent: number;
  period: string;
}

export function CardOptimizerWidget() {
  const [digest, setDigest] = useState<Digest | null>(null);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;
    fetchWeeklyDigest(uid)
      .then((res) => {
        const d = res.digest as unknown as Digest;
        setDigest(d);
      })
      .catch(() => {});
  }, []);

  if (!digest || digest.details.length === 0) return null;

  const topTip = digest.details[0];

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Zap size={16} className="text-amber-500" />
          Smart Card Tips
        </h3>
        <span className="text-xs text-muted-foreground">{digest.period}</span>
      </div>

      {digest.missed_rewards > 0 && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-amber-600" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              ${digest.missed_rewards.toFixed(2)} in potential rewards this week
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {digest.details.slice(0, 3).map((detail) => (
          <div key={detail.category} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CreditCard size={14} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  Use <span className="text-primary">{detail.best_card}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {detail.best_pct}% back on {detail.category} ({detail.transaction_count} txns)
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-green-600 tabular-nums flex-shrink-0 ml-2">
              +${detail.potential_cashback.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
