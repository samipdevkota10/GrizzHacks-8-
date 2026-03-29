"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Zap } from "lucide-react";
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

const CARD_BRAND: Record<string, { color: string; bg: string; border: string; text: string }> = {
  "Discover it Student Cash Back": {
    color: "#FF6600",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800/40",
    text: "text-orange-700 dark:text-orange-400",
  },
  "Wells Fargo Active Cash": {
    color: "#D71E28",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800/40",
    text: "text-red-700 dark:text-red-400",
  },
  "Wells Fargo Debit": {
    color: "#D71E28",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800/40",
    text: "text-red-700 dark:text-red-400",
  },
};

const DEFAULT_BRAND = {
  color: "#6366f1",
  bg: "bg-indigo-50 dark:bg-indigo-950/20",
  border: "border-indigo-200 dark:border-indigo-800/40",
  text: "text-indigo-700 dark:text-indigo-400",
};

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍔",
  grocery: "🛒",
  streaming: "📺",
  transport: "⛽",
  shopping: "🛍️",
  entertainment: "🎮",
  subscription: "📱",
  utilities: "💡",
  other: "💳",
};

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

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          Smart Card Tips
        </h3>
        <span className="text-[10px] text-muted-foreground font-medium">{digest.period}</span>
      </div>

      {digest.missed_rewards > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border border-green-200/60 dark:border-green-800/30 p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={12} className="text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              +${digest.missed_rewards.toFixed(2)} in missed rewards
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {digest.details.slice(0, 3).map((detail) => {
          const brand = CARD_BRAND[detail.best_card] || DEFAULT_BRAND;
          const emoji = CATEGORY_EMOJI[detail.category.toLowerCase()] || "💳";
          return (
            <div key={detail.category} className={`rounded-xl border p-3 ${brand.bg} ${brand.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base flex-shrink-0">{emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {detail.best_card}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {detail.best_pct}% back on {detail.category} · {detail.transaction_count} txns
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-600 dark:text-green-400 tabular-nums flex-shrink-0 ml-2">
                  +${detail.potential_cashback.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
