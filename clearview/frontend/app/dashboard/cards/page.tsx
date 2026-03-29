"use client";

import { CreditCard, Eye, EyeOff, Lock, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserId, fetchCards, type VirtualCard } from "@/lib/api";

const COLOR_MAP: Record<string, string> = {
  red: "#DC2626",
  green: "#16A34A",
  blue: "#4F8EF7",
  purple: "#7C3AED",
};

export default function CardsPage() {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    const uid = getUserId();
    if (!uid) { setLoading(false); return; }
    fetchCards(uid)
      .then((res) => setCards(res.cards))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleReveal = (id: string) => {
    setRevealedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your virtual subscription cards
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all">
          <CreditCard size={16} />
          Add Card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CreditCard size={40} className="mx-auto mb-3 opacity-40" />
          <p>No cards found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {cards.map((card) => {
            const revealed = revealedCards.has(card._id);
            const utilization = card.spending_limit_monthly > 0
              ? Math.round((card.spent_this_month / card.spending_limit_monthly) * 100)
              : null;
            const bg = COLOR_MAP[card.color_scheme] || "#1F1F1F";
            const isPaused = card.status === "paused";

            return (
              <div key={card._id} className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="p-6 text-white relative overflow-hidden" style={{ background: bg, opacity: isPaused ? 0.6 : 1 }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <span className="text-sm font-medium">{card.merchant_name || card.nickname}</span>
                      {card.merchant_name && card.nickname !== card.merchant_name && (
                        <span className="block text-xs opacity-60">{card.nickname}</span>
                      )}
                    </div>
                    <span className="text-xs uppercase tracking-wider opacity-60">
                      {card.merchant_category || "virtual"}
                    </span>
                  </div>
                  <p className="text-lg font-mono tracking-[0.25em] mb-6">
                    •••• •••• •••• {revealed ? card.last4 : "••••"}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase opacity-50 mb-0.5">Spent</p>
                      <p className="text-sm font-bold">${card.spent_this_month.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase opacity-50 mb-0.5">Limit</p>
                      <p className="text-sm font-bold">${card.spending_limit_monthly.toLocaleString()}/mo</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase opacity-50 mb-0.5">Exp</p>
                      <p className="text-sm font-bold">{String(card.exp_month).padStart(2, "0")}/{card.exp_year}</p>
                    </div>
                  </div>
                  {isPaused && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                      PAUSED
                    </div>
                  )}
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReveal(card._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                      {revealed ? "Hide" : "Reveal"}
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                  </div>
                  {utilization !== null && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(utilization, 100)}%`,
                            backgroundColor: utilization > 70 ? "#DC2626" : utilization > 40 ? "#F97316" : "#16A34A",
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{utilization}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
