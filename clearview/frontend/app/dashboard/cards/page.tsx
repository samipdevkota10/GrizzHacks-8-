"use client";

import {
  CreditCard,
  Eye,
  EyeOff,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
  DollarSign,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import {
  getUserId,
  fetchCards,
  createCard,
  pauseCard,
  deleteCard,
  updateCardLimit,
  type VirtualCard,
  type CreateCardPayload,
} from "@/lib/api";

const COLOR_MAP: Record<string, string> = {
  red: "#DC2626",
  green: "#16A34A",
  blue: "#4F8EF7",
  purple: "#7C3AED",
};

const COLOR_OPTIONS = [
  { value: "blue", label: "Blue", hex: "#4F8EF7" },
  { value: "red", label: "Red", hex: "#DC2626" },
  { value: "green", label: "Green", hex: "#16A34A" },
  { value: "purple", label: "Purple", hex: "#7C3AED" },
];

interface CreateCardForm {
  nickname: string;
  merchant_name: string;
  merchant_category: string;
  spending_limit_monthly: string;
  color_scheme: string;
}

const INITIAL_FORM: CreateCardForm = {
  nickname: "",
  merchant_name: "",
  merchant_category: "",
  spending_limit_monthly: "100",
  color_scheme: "blue",
};

export default function CardsPage() {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCardForm>(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState("");

  const loadCards = useCallback(async () => {
    const uid = getUserId();
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetchCards(uid);
      setCards(res.cards);
    } catch (err) {
      console.error("Failed to load cards:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const toggleReveal = (id: string) => {
    setRevealedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = getUserId();
    if (!uid) return;

    setCreating(true);
    try {
      const payload: CreateCardPayload = {
        user_id: uid,
        nickname: createForm.nickname || createForm.merchant_name,
        merchant_name: createForm.merchant_name,
        merchant_category: createForm.merchant_category,
        spending_limit_monthly: parseFloat(createForm.spending_limit_monthly) || 100,
        color_scheme: createForm.color_scheme,
      };
      await createCard(payload);
      setShowCreateModal(false);
      setCreateForm(INITIAL_FORM);
      await loadCards();
    } catch (err) {
      console.error("Failed to create card:", err);
      alert(err instanceof Error ? err.message : "Failed to create card");
    } finally {
      setCreating(false);
    }
  };

  const handlePause = async (cardId: string) => {
    setActionInProgress(cardId);
    try {
      await pauseCard(cardId);
      await loadCards();
    } catch (err) {
      console.error("Failed to toggle pause:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (cardId: string, merchantName: string) => {
    if (!confirm(`Destroy the card for ${merchantName}? This cannot be undone.`)) return;
    setActionInProgress(cardId);
    try {
      await deleteCard(cardId);
      await loadCards();
    } catch (err) {
      console.error("Failed to delete card:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUpdateLimit = async (cardId: string) => {
    const limit = parseFloat(newLimit);
    if (isNaN(limit) || limit <= 0) return;
    setActionInProgress(cardId);
    try {
      await updateCardLimit(cardId, limit);
      setEditingLimit(null);
      setNewLimit("");
      await loadCards();
    } catch (err) {
      console.error("Failed to update limit:", err);
    } finally {
      setActionInProgress(null);
    }
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
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Add Card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CreditCard size={40} className="mx-auto mb-3 opacity-40" />
          <p>No cards found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => {
            const revealed = revealedCards.has(card._id);
            const utilization =
              card.spending_limit_monthly > 0
                ? Math.round(
                    (card.spent_this_month / card.spending_limit_monthly) * 100
                  )
                : null;
            const bg = COLOR_MAP[card.color_scheme] || "#1F1F1F";
            const isPaused = card.status === "paused";
            const busy = actionInProgress === card._id;

            return (
              <div
                key={card._id}
                className="rounded-2xl bg-card border border-border overflow-hidden"
              >
                <div
                  className="p-6 text-white relative overflow-hidden"
                  style={{ background: bg, opacity: isPaused ? 0.6 : 1 }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <span className="text-sm font-medium">
                        {card.merchant_name || card.nickname}
                      </span>
                      {card.merchant_name &&
                        card.nickname !== card.merchant_name && (
                          <span className="block text-xs opacity-60">
                            {card.nickname}
                          </span>
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
                      <p className="text-[10px] uppercase opacity-50 mb-0.5">
                        Spent
                      </p>
                      <p className="text-sm font-bold">
                        ${card.spent_this_month.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase opacity-50 mb-0.5">
                        Limit
                      </p>
                      <p className="text-sm font-bold">
                        ${card.spending_limit_monthly.toLocaleString()}/mo
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase opacity-50 mb-0.5">
                        Exp
                      </p>
                      <p className="text-sm font-bold">
                        {String(card.exp_month).padStart(2, "0")}/
                        {card.exp_year}
                      </p>
                    </div>
                  </div>
                  {isPaused && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                      PAUSED
                    </div>
                  )}
                </div>

                {/* Card action buttons */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleReveal(card._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                      {revealed ? "Hide" : "Reveal"}
                    </button>
                    <button
                      onClick={() => handlePause(card._id)}
                      disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50"
                    >
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingLimit(
                          editingLimit === card._id ? null : card._id
                        );
                        setNewLimit(
                          String(card.spending_limit_monthly)
                        );
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      <DollarSign size={14} />
                      Limit
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(
                          card._id,
                          card.merchant_name || card.nickname
                        )
                      }
                      disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {utilization !== null && editingLimit !== card._id && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(utilization, 100)}%`,
                            backgroundColor:
                              utilization > 70
                                ? "#DC2626"
                                : utilization > 40
                                  ? "#F97316"
                                  : "#16A34A",
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {utilization}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Inline limit editor */}
                {editingLimit === card._id && (
                  <div className="px-4 pb-4 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={newLimit}
                      onChange={(e) => setNewLimit(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      onClick={() => handleUpdateLimit(card._id)}
                      disabled={busy}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingLimit(null)}
                      className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Card Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Create Virtual Card
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm(INITIAL_FORM);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Merchant Name
                </label>
                <input
                  type="text"
                  value={createForm.merchant_name}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      merchant_name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Netflix, Spotify"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nickname (optional)
                </label>
                <input
                  type="text"
                  value={createForm.nickname}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, nickname: e.target.value }))
                  }
                  placeholder="e.g. Streaming Card"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Category
                </label>
                <select
                  value={createForm.merchant_category}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      merchant_category: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Select category</option>
                  <option value="streaming">Streaming</option>
                  <option value="software">Software</option>
                  <option value="gaming">Gaming</option>
                  <option value="food">Food & Delivery</option>
                  <option value="fitness">Fitness</option>
                  <option value="shopping">Shopping</option>
                  <option value="utilities">Utilities</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Monthly Spending Limit ($)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={createForm.spending_limit_monthly}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      spending_limit_monthly: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Card Color
                </label>
                <div className="flex gap-3">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        setCreateForm((f) => ({ ...f, color_scheme: c.value }))
                      }
                      className="w-10 h-10 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: c.hex,
                        borderColor:
                          createForm.color_scheme === c.value
                            ? "white"
                            : "transparent",
                        boxShadow:
                          createForm.color_scheme === c.value
                            ? `0 0 0 2px ${c.hex}`
                            : "none",
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm(INITIAL_FORM);
                  }}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={16} />
                      Create Card
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
