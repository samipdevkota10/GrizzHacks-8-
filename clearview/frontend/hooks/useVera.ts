"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CallState = "idle" | "connecting" | "connected" | "thinking" | "speaking" | "ended";

interface VoiceMessage {
  role: "user" | "vera";
  content: string;
}

export function useVera(userId: string) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const sessionTokenRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCall = useCallback(async () => {
    setCallState("connecting");
    setMessages([]);
    setDuration(0);

    try {
      const res = await fetch(`${API_URL}/api/voice/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, mode: "voice" }),
      });
      const data = await res.json();
      sessionTokenRef.current = data.session_token;

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

      if (data.mock) {
        setTimeout(() => setCallState("connected"), 1000);
        setTimeout(() => {
          setCallState("speaking");
          setMessages([
            {
              role: "vera",
              content: `Hey! I've got your finances pulled up. What's on your mind?`,
            },
          ]);
        }, 2500);
        setTimeout(() => setCallState("connected"), 5000);
      } else {
        setCallState("connected");
      }
    } catch {
      setCallState("ended");
    }
  }, [userId]);

  const endCall = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionTokenRef.current) {
      try {
        await fetch(`${API_URL}/api/voice/session/${sessionTokenRef.current}`, {
          method: "DELETE",
        });
      } catch {
        /* ignore */
      }
    }
    setCallState("ended");
    setTimeout(() => setCallState("idle"), 2000);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  return {
    callState,
    messages,
    isMuted,
    duration,
    startCall,
    endCall,
    toggleMute,
    formatDuration,
  };
}
