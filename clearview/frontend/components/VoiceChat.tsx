"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import { Conversation } from "@elevenlabs/client";
import { getUserId, createVoiceSession, submitAdvisorCallResult } from "@/lib/api";

type VoiceState = "idle" | "connecting" | "connected" | "speaking" | "listening" | "error";

export default function VoiceChat() {
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const convRef = useRef<Awaited<ReturnType<typeof Conversation.startSession>> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      convRef.current?.endSession().catch(() => {});
    };
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleStart = useCallback(async () => {
    const uid = getUserId();
    if (!uid) {
      setError("Not logged in");
      setState("error");
      return;
    }

    setState("connecting");
    setError("");
    setElapsedSec(0);

    try {
      const session = await createVoiceSession(uid);

      const conversation = await Conversation.startSession({
        signedUrl: session.signed_url,
        overrides: session.overrides,
        onConnect: () => {
          setState("connected");
          startTimer();
        },
        onDisconnect: () => {
          setState("idle");
          stopTimer();
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          submitAdvisorCallResult({
            conversation_id: session.conversation_id,
            status: "completed",
            duration_seconds: duration,
          }).catch(() => {});
        },
        onError: (msg) => {
          console.error("ElevenLabs error:", msg);
          setError(typeof msg === "string" ? msg : "Voice connection error");
          setState("error");
          stopTimer();
        },
        onModeChange: (mode) => {
          if (mode.mode === "speaking") setState("speaking");
          else if (mode.mode === "listening") setState("listening");
          else setState("connected");
        },
      });

      convRef.current = conversation;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start voice session");
      setState("error");
      setTimeout(() => setState("idle"), 8000);
    }
  }, [startTimer, stopTimer]);

  const handleEnd = useCallback(async () => {
    stopTimer();
    try {
      await convRef.current?.endSession();
    } catch {
      // already ended
    }
    convRef.current = null;
    setState("idle");
  }, [stopTimer]);

  const toggleMute = useCallback(async () => {
    if (!convRef.current) return;
    const next = !isMuted;
    await convRef.current.setVolume({ volume: next ? 0 : 1 });
    setIsMuted(next);
  }, [isMuted]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const isActive = state !== "idle" && state !== "error";
  const pulseClass =
    state === "speaking"
      ? "animate-pulse bg-green-500/20 border-green-500/60"
      : state === "listening"
        ? "animate-pulse bg-blue-500/20 border-blue-500/60"
        : state === "connected"
          ? "bg-primary/10 border-primary/40"
          : "";

  if (!isActive && state !== "error") {
    return (
      <button
        onClick={handleStart}
        disabled={state === "connecting" as never}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 transition-all shadow-sm"
      >
        <Mic size={16} />
        Talk to Vera
      </button>
    );
  }

  if (state === "connecting") {
    return (
      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary border border-primary/30">
        <Loader2 size={16} className="animate-spin" />
        Connecting...
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setState("idle")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/30"
        >
          <MicOff size={16} />
          Try again
        </button>
        {error && <p className="text-[11px] text-red-500 max-w-xs">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all ${pulseClass}`}>
        {state === "speaking" ? (
          <div className="flex gap-0.5 items-end h-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-1 bg-green-500 rounded-full animate-bounce"
                style={{
                  height: `${8 + Math.random() * 16}px`,
                  animationDelay: `${i * 80}ms`,
                  animationDuration: "0.6s",
                }}
              />
            ))}
          </div>
        ) : state === "listening" ? (
          <Mic size={28} className="text-blue-500" />
        ) : (
          <Mic size={28} className="text-primary" />
        )}
      </div>

      <div className="text-center">
        <p className="text-xs font-medium text-foreground">
          {state === "speaking" && "Vera is speaking..."}
          {state === "listening" && "Listening to you..."}
          {state === "connected" && "Connected"}
        </p>
        <p className="text-[11px] text-muted-foreground font-mono">{formatTime(elapsedSec)}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={toggleMute}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isMuted ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/30" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        <button
          onClick={handleEnd}
          className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 border border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition-all"
        >
          <PhoneOff size={16} />
        </button>
      </div>
    </div>
  );
}
