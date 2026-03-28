"use client";

import { useState, useCallback, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useVirtualCards(hydrated: boolean, userId: string | null) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/cards/${userId}`);
      const data = await res.json();
      setCards(data.cards || []);
    } catch (err) {
      console.error("Failed to fetch cards:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!hydrated) return;
    if (!userId) {
      setCards([]);
      setLoading(false);
      return;
    }
    fetchCards();
  }, [hydrated, userId, fetchCards]);

  const pauseCard = useCallback(
    async (cardId: string) => {
      if (!userId) return;
      await fetch(`${API_URL}/api/cards/${cardId}/pause`, { method: "PATCH" });
      fetchCards();
    },
    [userId, fetchCards],
  );

  const destroyCard = useCallback(
    async (cardId: string) => {
      if (!userId) return;
      await fetch(`${API_URL}/api/cards/${cardId}`, { method: "DELETE" });
      // Don't refetch immediately — let animation play
      setTimeout(fetchCards, 1000);
    },
    [userId, fetchCards],
  );

  const createCard = useCallback(
    async (data: any) => {
      if (!userId) return;
      await fetch(`${API_URL}/api/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, user_id: userId }),
      });
      fetchCards();
    },
    [userId, fetchCards],
  );

  return { cards, loading, fetchCards, pauseCard, destroyCard, createCard };
}
