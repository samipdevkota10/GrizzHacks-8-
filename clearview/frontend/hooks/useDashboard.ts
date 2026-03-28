"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardData } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useDashboard(hydrated: boolean, userId: string | null) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/dashboard/${userId}`);
      if (!res.ok) throw new Error(`Failed to fetch dashboard: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!hydrated) return;
    if (!userId) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }
    fetchDashboard();
  }, [hydrated, userId, fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
}
