"use client";

import { useState, useEffect } from "react";
import { readClearviewUserIdFromStorage } from "@/lib/userId";

/** After mount, `hydrated` is true. `userId` is null if unset or invalid. */
export function useClearviewUserId() {
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(readClearviewUserIdFromStorage());
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "clearview_user_id" || e.key === null) {
        setUserId(readClearviewUserIdFromStorage());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { hydrated, userId };
}
