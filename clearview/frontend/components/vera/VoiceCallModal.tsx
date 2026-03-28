"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/formatters";
import { VeraAvatar } from "./VeraAvatar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CallUiState = "connecting" | "connected" | "thinking" | "speaking" | "ended";

type VoiceMessage = {
  role: "user" | "vera";
  content: string;
};

type VoiceCallModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
};

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceCallModal({ isOpen, onClose, userId }: VoiceCallModalProps) {
  const [callState, setCallState] = useState<CallUiState>("connecting");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);

  const sessionTokenRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;

  const clearScheduledTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  const teardownMedia = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    recorderRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const deleteSession = useCallback(async () => {
    const token = sessionTokenRef.current;
    sessionTokenRef.current = null;
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/voice/session/${token}`, { method: "DELETE" });
    } catch {
      /* graceful */
    }
  }, []);

  const runCleanup = useCallback(async () => {
    clearScheduledTimeouts();
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    teardownMedia();
    await deleteSession();
  }, [clearScheduledTimeouts, deleteSession, teardownMedia]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let cancelled = false;

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeoutsRef.current.push(id);
    };

    setCallState("connecting");
    setMessages([]);
    setIsMuted(false);
    setSpeakerOn(true);
    setDuration(0);

    durationIntervalRef.current = setInterval(() => {
      if (!cancelled) setDuration((d) => d + 1);
    }, 1000);

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/voice/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, mode: "voice" }),
        });
        if (!res.ok) throw new Error("session failed");
        const data = (await res.json()) as {
          session_token?: string;
          mock?: boolean;
          signed_url?: string;
        };
        if (cancelled) return;

        sessionTokenRef.current = data.session_token ?? null;

        if (data.mock) {
          schedule(() => setCallState("connected"), 1000);
          schedule(() => setCallState("thinking"), 3000);
          schedule(() => {
            setCallState("speaking");
            setMessages((prev) => [
              ...prev,
              {
                role: "vera",
                content:
                  "Hey! I've got your finances pulled up. What's on your mind?",
              },
            ]);
          }, 5000);
          schedule(() => setCallState("connected"), 8000);
        } else {
          setCallState("connected");
          const url = data.signed_url;
          if (url) {
            try {
              const ws = new WebSocket(url);
              wsRef.current = ws;
              ws.onerror = () => {
                /* fail gracefully */
              };
            } catch {
              /* graceful */
            }
          }
        }
      } catch {
        if (!cancelled) {
          setCallState("ended");
          await runCleanup();
          onCloseRef.current();
        }
      }
    })();

    return () => {
      cancelled = true;
      void runCleanup();
    };
  }, [isOpen, userId, runCleanup]);

  const handleEndCall = useCallback(async () => {
    setCallState("ended");
    await runCleanup();
    onClose();
  }, [onClose, runCleanup]);

  const statusLine = (() => {
    switch (callState) {
      case "connecting":
        return (
          <p className="animate-pulse text-text-primary">Connecting...</p>
        );
      case "connected":
        return <p className="text-text-secondary">Listening...</p>;
      case "thinking":
        return <p className="text-vera-primary">Vera is thinking...</p>;
      case "speaking":
        return <p className="text-vera-primary">Vera is speaking...</p>;
      case "ended":
        return <p className="text-text-secondary">Call ended</p>;
      default:
        return null;
    }
  })();

  const speaking = callState === "speaking";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary/95 backdrop-blur-xl px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vera-voice-call-title"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex w-full flex-col items-center gap-1">
          <p
            id="vera-voice-call-title"
            className="text-sm font-medium uppercase tracking-wider text-text-secondary"
          >
            Voice Call with Vera
          </p>
          <p className="font-mono text-sm text-text-secondary tabular-nums">
            {formatDuration(duration)}
          </p>
        </div>

        <VeraAvatar size={200} speaking={speaking} />

        <div className="flex min-h-[1.5rem] items-center justify-center">
          {statusLine}
        </div>

        <div
          className="max-h-40 w-full overflow-y-auto rounded-xl border border-border-subtle bg-bg-secondary/80 p-3 text-sm"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <p className="text-text-muted">Transcript will appear here…</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {messages.map((msg, idx) => (
                <li
                  key={`${msg.role}-${idx}-${msg.content.slice(0, 12)}`}
                  className={cn(
                    msg.role === "vera" ? "text-vera-primary" : "text-text-primary"
                  )}
                >
                  <span className="text-text-muted">
                    {msg.role === "vera" ? "Vera" : "You"}:{" "}
                  </span>
                  {msg.content}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-6 pt-2">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-tertiary text-text-primary transition-colors hover:bg-bg-tertiary/80"
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>
          <button
            type="button"
            onClick={() => void handleEndCall()}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-negative text-white transition-opacity hover:opacity-90"
            aria-label="End call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setSpeakerOn((s) => !s)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-tertiary text-text-primary transition-colors hover:bg-bg-tertiary/80"
            aria-label={speakerOn ? "Speaker on" : "Speaker off"}
          >
            {speakerOn ? (
              <Volume2 className="h-6 w-6" />
            ) : (
              <VolumeX className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
