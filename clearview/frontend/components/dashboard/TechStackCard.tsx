"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const STACK = [
  {
    name: "Google Gemini",
    role: "AI advisor chat, purchase analysis, receipt OCR, fraud call scripts",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  {
    name: "ElevenLabs",
    role: "Voice synthesis, ConvAI agent, outbound Twilio phone calls",
    color: "bg-primary/8 text-primary/80 border-primary/15",
  },
  {
    name: "Plaid",
    role: "Real bank account & transaction sync",
    color: "bg-secondary text-foreground border-border",
  },
  {
    name: "Stripe Issuing",
    role: "Virtual card creation, pause, spend limits",
    color: "bg-secondary text-foreground border-border",
  },
  {
    name: "MongoDB",
    role: "All data: users, transactions, fraud alerts, conversations",
    color: "bg-secondary text-foreground border-border",
  },
  {
    name: "FastAPI + Next.js",
    role: "Backend REST API · Frontend dashboard",
    color: "bg-secondary text-foreground border-border",
  },
];

export function TechStackCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {["bg-primary/70", "bg-primary/40", "bg-muted-foreground/30"].map((c, i) => (
              <span key={i} className={`inline-flex h-2.5 w-2.5 rounded-full ${c}`} />
            ))}
          </div>
          <span className="text-sm font-bold text-foreground ml-1">Powered by</span>
          <span className="text-sm text-muted-foreground">Gemini · ElevenLabs · Plaid · Stripe</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
          {STACK.map((item) => (
            <div
              key={item.name}
              className={`rounded-xl border px-3 py-2.5 ${item.color}`}
            >
              <p className="text-xs font-semibold">{item.name}</p>
              <p className="text-[10px] opacity-70 mt-0.5 leading-relaxed">{item.role}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
