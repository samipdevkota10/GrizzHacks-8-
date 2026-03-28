"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Camera } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { QuickChips } from "./QuickChips";
import { TypingIndicator } from "./TypingIndicator";
import { useAdvisor } from "@/hooks/useAdvisor";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onOpenCamera: () => void;
}

export function ChatPanel({
  isOpen,
  onClose,
  userId,
  onOpenCamera,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const { messages, loading, sendMessage } = useAdvisor(userId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !userId) return;
    setInput("");
    await sendMessage(text);
  };

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close advisor overlay"
          className="fixed inset-0 z-30 bg-black/40"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed top-0 right-0 z-40 flex h-full w-[420px] flex-col border-l border-border-subtle bg-bg-secondary shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border-subtle px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full bg-vera-primary shadow-[0_0_8px_rgba(167,139,250,0.8)]"
              aria-hidden
            />
            <h2 className="text-lg font-semibold text-text-primary">Vera</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Close advisor"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
        >
          {messages.length === 0 ? (
            <QuickChips onSelect={(msg) => (userId ? void sendMessage(msg) : undefined)} />
          ) : null}
          <div className="flex flex-col space-y-4">
            {messages.map((m, i) => (
              <ChatMessage
                key={`${m.timestamp}-${i}`}
                role={m.role}
                content={m.content}
                timestamp={m.timestamp}
              />
            ))}
            {loading ? <TypingIndicator /> : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-border-subtle p-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenCamera}
              disabled={!userId}
              className="shrink-0 rounded-xl bg-bg-tertiary p-3 text-text-secondary transition-colors hover:bg-bg-primary hover:text-accent-blue disabled:pointer-events-none disabled:opacity-40"
              aria-label="Open camera"
            >
              <Camera className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={userId ? "Ask Vera…" : "Set user id in localStorage first"}
              disabled={loading || !userId}
              className="min-w-0 flex-1 rounded-xl bg-bg-tertiary px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/40 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={loading || !input.trim() || !userId}
              className="shrink-0 rounded-xl bg-accent-blue p-3 text-white transition-colors hover:bg-accent-blue-dim disabled:pointer-events-none disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
