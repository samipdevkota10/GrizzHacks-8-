"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  BrainCircuit,
  Sparkles,
  Phone,
  PhoneOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getUserId,
  sendChat,
  startAdvisorCall,
  fetchAdvisorCalls,
  type AdvisorCallSummary,
  type AdvisorCallStatus,
} from "@/lib/api";

type Message = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "How can I reduce my spending?",
  "Should I pay off my credit card faster?",
  "Am I saving enough for emergencies?",
  "What subscriptions should I cancel?",
];

function statusBadge(status: AdvisorCallStatus) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
          <CheckCircle2 size={10} /> Completed
        </span>
      );
    case "calling":
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 animate-pulse">
          <Phone size={10} /> In Progress
        </span>
      );
    case "no_answer":
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600">
          <PhoneOff size={10} /> No Answer
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
          <AlertTriangle size={10} /> Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {status}
        </span>
      );
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CallHistoryCard({ call }: { call: AdvisorCallSummary }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = call.summary || call.next_steps?.length || call.action_requests?.length;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-primary" />
          <span className="text-sm font-medium text-foreground">
            {formatTime(call.started_at)}
          </span>
          {call.duration_seconds != null && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={10} /> {formatDuration(call.duration_seconds)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(call.status)}
          {hasDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {call.key_topics?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {call.key_topics.map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
            >
              {t.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {expanded && hasDetails && (
        <div className="space-y-3 pt-2 border-t border-border">
          {call.summary && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
              <p className="text-sm text-foreground leading-relaxed">{call.summary}</p>
            </div>
          )}

          {call.next_steps?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Next Steps</p>
              <ul className="space-y-1">
                {call.next_steps.map((step, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <CheckCircle2 size={12} className="text-primary mt-0.5 shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {call.action_requests?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Requested Actions</p>
              {call.action_requests.map((action, i) => (
                <div
                  key={i}
                  className="text-sm rounded-lg bg-warm p-2.5 mb-1.5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {action.type.replace(/_/g, " ")}: {action.target_name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        action.confidence === "high"
                          ? "bg-green-500/10 text-green-600"
                          : action.confidence === "medium"
                            ? "bg-yellow-500/10 text-yellow-600"
                            : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {action.confidence}
                    </span>
                  </div>
                  {action.user_consent_quote && (
                    <p className="text-xs text-muted-foreground italic">
                      &ldquo;{action.user_consent_quote}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {call.safety_flags?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-yellow-600 mb-1 flex items-center gap-1">
                <AlertTriangle size={10} /> Safety Flags
              </p>
              <ul className="space-y-0.5">
                {call.safety_flags.map((flag, i) => (
                  <li key={i} className="text-xs text-yellow-600">{flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hi! I'm Vera, your AI financial advisor. I've analyzed your accounts and I'm ready to help. What would you like to know about your finances?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [callState, setCallState] = useState<"idle" | "initiating" | "calling" | "error">("idle");
  const [callPhoneLast4, setCallPhoneLast4] = useState("");
  const [callError, setCallError] = useState("");
  const [recentCalls, setRecentCalls] = useState<AdvisorCallSummary[]>([]);
  const [showCallHistory, setShowCallHistory] = useState(true);

  const loadCalls = useCallback(async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const res = await fetchAdvisorCalls(uid);
      setRecentCalls(res.calls);
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleStartCall = async () => {
    const uid = getUserId();
    if (!uid) return;

    setCallState("initiating");
    setCallError("");

    try {
      const res = await startAdvisorCall(uid);
      if (!res.success) {
        setCallError("The server did not confirm an outbound call. Check ElevenLabs and env vars.");
        setCallState("error");
        setTimeout(() => setCallState("idle"), 8000);
        return;
      }
      setCallPhoneLast4(res.phone_last4);
      setCallState("calling");

      setTimeout(() => {
        setCallState("idle");
        loadCalls();
      }, 120000);
    } catch (err) {
      setCallError(err instanceof Error ? err.message : "Failed to start call");
      setCallState("error");
      setTimeout(() => {
        setCallState("idle");
        setCallError("");
      }, 12000);
    }
  };

  const send = async (text: string) => {
    if (!text.trim()) return;
    const uid = getUserId();
    if (!uid) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);

    try {
      const res = await sendChat(uid, text, conversationId);
      setConversationId(res.conversation_id);
      setMessages((m) => [...m, { role: "ai", text: res.response }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ai", text: "Sorry, I couldn't process that request. Please make sure the backend is running." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BrainCircuit size={24} className="text-primary" />
            AI Advisor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Get personalized financial advice from Vera</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Outbound calls use your profile phone in E.164 format (e.g. +1…). The server needs
            ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID, and ELEVENLABS_PHONE_NUMBER_ID.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleStartCall}
            disabled={callState !== "idle"}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              callState === "calling"
                ? "bg-green-500/10 text-green-600 border border-green-500/30 cursor-wait"
                : callState === "initiating"
                  ? "bg-primary/10 text-primary border border-primary/30 cursor-wait"
                  : callState === "error"
                    ? "bg-red-500/10 text-red-500 border border-red-500/30"
                    : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            <Phone size={16} className={callState === "calling" ? "animate-pulse" : ""} />
            {callState === "initiating" && "Starting call..."}
            {callState === "calling" && `Calling ...${callPhoneLast4}`}
            {callState === "error" && "Call failed"}
            {callState === "idle" && "Call me now"}
          </button>
          {callState === "calling" && (
            <p className="text-[11px] text-muted-foreground">
              Vera is calling your number ending in {callPhoneLast4}
            </p>
          )}
          {callError && (
            <p className="text-[11px] text-red-600 max-w-xs text-right whitespace-pre-wrap leading-snug">{callError}</p>
          )}
        </div>
      </div>

      {recentCalls.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowCallHistory(!showCallHistory)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <Phone size={12} />
            Recent phone conversations ({recentCalls.length})
            {showCallHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showCallHistory && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentCalls.map((call) => (
                <CallHistoryCard key={call._id} call={call} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-2xl bg-card border border-border p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-warm text-foreground"
              }`}
            >
              {msg.role === "ai" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={12} className="text-primary" />
                  <span className="text-xs font-medium text-primary">Vera</span>
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-warm rounded-2xl px-4 py-3 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-3 mt-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Vera anything about your finances..."
          className="flex-1 rounded-xl bg-card border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || typing}
          className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
