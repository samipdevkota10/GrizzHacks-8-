"use client";

import { useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PurchaseResult {
  product: string;
  price: number;
  currency: string;
  verdict: "yes" | "careful" | "no";
  reasoning: string;
  conversation_id: string;
}

export function useCamera(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = useCallback(
    async (file: File) => {
      if (!userId) {
        setError("Set clearview_user_id in localStorage first.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("user_id", userId);

        const res = await fetch(`${API_URL}/api/advisor/purchase-check`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
        const data = await res.json();
        setResult(data);
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Analysis failed";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, result, error, analyzeImage, clearResult };
}
