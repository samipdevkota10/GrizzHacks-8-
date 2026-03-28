"use client";

import { useState, useRef, useEffect } from "react";
import { Send, BrainCircuit, Sparkles } from "lucide-react";

type Message = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "How can I reduce my spending?",
  "Should I pay off my student loan faster?",
  "Am I saving enough for an emergency fund?",
  "What subscriptions should I cancel?",
];

const AI_RESPONSES: Record<string, string> = {
  default:
    "Based on your financial profile, you're doing well with a 39.4% savings rate. Your biggest opportunity is in the Shopping category — you're $60 over budget this month. Consider setting up spending alerts for that category. Would you like me to create a plan to reduce discretionary spending by 15%?",
};

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hi Alex! I'm Vera, your AI financial advisor. I've analyzed your accounts and I'm ready to help. What would you like to know about your finances?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    await new Promise((r) => setTimeout(r, 1500));
    setMessages((m) => [...m, { role: "ai", text: AI_RESPONSES.default }]);
    setTyping(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BrainCircuit size={24} className="text-primary" />
          AI Advisor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Get personalized financial advice from Vera</p>
      </div>

      {/* Chat area */}
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

      {/* Suggestions */}
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

      {/* Input */}
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
          disabled={!input.trim()}
          className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
