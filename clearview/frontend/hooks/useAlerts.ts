"use client";

import { useState, useCallback } from "react";
import { takeAlertAction } from "@/lib/api";

export function useAlerts(onActionComplete?: () => void) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = useCallback(
    async (alertId: string, action: string) => {
      try {
        setActionLoading(alertId);
        await takeAlertAction(alertId, action);
        onActionComplete?.();
      } catch (err) {
        console.error("Alert action failed:", err);
      } finally {
        setActionLoading(null);
      }
    },
    [onActionComplete]
  );

  return { handleAction, actionLoading };
}
