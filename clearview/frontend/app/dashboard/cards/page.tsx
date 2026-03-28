"use client";

import { CreditCard, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { CARDS } from "@/lib/mock-data";

export default function CardsPage() {
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    setRevealedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your credit and debit cards
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all">
          <CreditCard size={16} />
          Add Card
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CARDS.map((card) => {
          const revealed = revealedCards.has(card.id);
          const utilization = card.limit ? Math.round((card.balance / card.limit) * 100) : null;
          return (
            <div key={card.id} className="rounded-2xl bg-card border border-border overflow-hidden">
              {/* Card visual */}
              <div className="p-6 text-white relative overflow-hidden" style={{ background: card.color }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                <div className="flex items-center justify-between mb-8">
                  <span className="text-sm font-medium opacity-80">{card.name}</span>
                  <span className="text-xs uppercase tracking-wider opacity-60">{card.type}</span>
                </div>
                <p className="text-lg font-mono tracking-[0.25em] mb-6">
                  •••• •••• •••• {revealed ? card.last4 : "••••"}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase opacity-50 mb-0.5">Balance</p>
                    <p className="text-sm font-bold">${card.balance.toLocaleString()}</p>
                  </div>
                  {card.limit && (
                    <div className="text-right">
                      <p className="text-[10px] uppercase opacity-50 mb-0.5">Limit</p>
                      <p className="text-sm font-bold">${card.limit.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card actions */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleReveal(card.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                    {revealed ? "Hide" : "Reveal"}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    <Lock size={14} />
                    Freeze
                  </button>
                </div>
                {utilization !== null && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${utilization}%`,
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
    </div>
  );
}
