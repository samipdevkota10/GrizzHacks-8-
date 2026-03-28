"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Target,
  CreditCard,
  Building2,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Plus,
  X,
} from "lucide-react";

const STEPS = [
  { label: "Goals", icon: Target },
  { label: "Cards", icon: CreditCard },
  { label: "Bank", icon: Building2 },
  { label: "Loans", icon: FileText },
];

const GOALS = [
  { id: "emergency", label: "Build Emergency Fund", icon: "🛡️" },
  { id: "save", label: "Save for a Big Purchase", icon: "🏠" },
  { id: "debt", label: "Pay Off Debt Faster", icon: "💳" },
  { id: "invest", label: "Start Investing", icon: "📈" },
  { id: "budget", label: "Track My Spending", icon: "📊" },
  { id: "retire", label: "Plan for Retirement", icon: "🏖️" },
];

type CardEntry = { name: string; last4: string; type: "credit" | "debit" };
type LoanEntry = { name: string; balance: string; rate: string; monthly: string };

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [cards, setCards] = useState<CardEntry[]>([]);
  const [cardDraft, setCardDraft] = useState<CardEntry>({ name: "", last4: "", type: "debit" });
  const [bankConnected, setBankConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [loans, setLoans] = useState<LoanEntry[]>([]);
  const [loanDraft, setLoanDraft] = useState<LoanEntry>({ name: "", balance: "", rate: "", monthly: "" });

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addCard = () => {
    if (!cardDraft.name || !cardDraft.last4) return;
    setCards((c) => [...c, cardDraft]);
    setCardDraft({ name: "", last4: "", type: "debit" });
  };

  const addLoan = () => {
    if (!loanDraft.name || !loanDraft.balance) return;
    setLoans((l) => [...l, loanDraft]);
    setLoanDraft({ name: "", balance: "", rate: "", monthly: "" });
  };

  const connectBank = async () => {
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setBankConnected(true);
    setConnecting(false);
  };

  const finish = () => {
    window.location.href = "/dashboard";
  };

  const canProceed = [
    selectedGoals.size > 0,
    true,
    true,
    true,
  ];

  const inputCls = "w-full rounded-xl bg-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-warm via-background to-light-accent/20" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl"
      >
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle2 size={18} /> : <s.icon size={16} />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 rounded-full transition-all ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-card border border-border p-8 shadow-sm">
          <AnimatePresence mode="wait">
            {/* Step 0: Goals */}
            {step === 0 && (
              <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-foreground mb-2">What are your financial goals?</h2>
                <p className="text-sm text-muted-foreground mb-6">Select all that apply. This helps us personalize your experience.</p>
                <div className="grid grid-cols-2 gap-3">
                  {GOALS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                        selectedGoals.has(g.id)
                          ? "border-primary bg-light-accent"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-xl">{g.icon}</span>
                      <span className="text-sm font-medium text-foreground">{g.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Cards */}
            {step === 1 && (
              <motion.div key="cards" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-foreground mb-2">Add your cards</h2>
                <p className="text-sm text-muted-foreground mb-6">Add your credit and debit cards to track spending.</p>

                {cards.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {cards.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-warm border border-border">
                        <div className="flex items-center gap-3">
                          <CreditCard size={16} className="text-primary" />
                          <span className="text-sm font-medium text-foreground">{c.name}</span>
                          <span className="text-xs text-muted-foreground">••••{c.last4}</span>
                        </div>
                        <button onClick={() => setCards((cs) => cs.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 p-4 rounded-xl bg-background border border-border">
                  <input placeholder="Card name (e.g. Chase Sapphire)" value={cardDraft.name} onChange={(e) => setCardDraft({ ...cardDraft, name: e.target.value })} className={inputCls} />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Last 4 digits" maxLength={4} value={cardDraft.last4} onChange={(e) => setCardDraft({ ...cardDraft, last4: e.target.value.replace(/\D/g, "") })} className={inputCls} />
                    <select value={cardDraft.type} onChange={(e) => setCardDraft({ ...cardDraft, type: e.target.value as "credit" | "debit" })} className={inputCls}>
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <button onClick={addCard} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    <Plus size={14} /> Add card
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Bank */}
            {step === 2 && (
              <motion.div key="bank" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-foreground mb-2">Connect your bank</h2>
                <p className="text-sm text-muted-foreground mb-6">Securely link your bank accounts via Plaid (sandbox mode).</p>

                {bankConnected ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} className="text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-foreground">Bank Connected!</p>
                    <p className="text-sm text-muted-foreground mt-1">Chase Checking ••••4821 linked successfully</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={connectBank}
                      disabled={connecting}
                      className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-warm transition-all"
                    >
                      {connecting ? (
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : (
                        <Building2 size={20} className="text-primary" />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {connecting ? "Connecting..." : "Connect with Plaid"}
                      </span>
                    </button>
                    <p className="text-xs text-center text-muted-foreground">
                      Sandbox mode — no real bank data is accessed. Powered by Plaid.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Loans */}
            {step === 3 && (
              <motion.div key="loans" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-foreground mb-2">Any loans or mortgages?</h2>
                <p className="text-sm text-muted-foreground mb-6">Add outstanding debts so we can factor them into your financial plan.</p>

                {loans.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {loans.map((l, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-warm border border-border">
                        <div>
                          <span className="text-sm font-medium text-foreground">{l.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">${l.balance} at {l.rate}%</span>
                        </div>
                        <button onClick={() => setLoans((ls) => ls.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 p-4 rounded-xl bg-background border border-border">
                  <input placeholder="Loan name (e.g. Student Loan)" value={loanDraft.name} onChange={(e) => setLoanDraft({ ...loanDraft, name: e.target.value })} className={inputCls} />
                  <div className="grid grid-cols-3 gap-3">
                    <input placeholder="Balance" value={loanDraft.balance} onChange={(e) => setLoanDraft({ ...loanDraft, balance: e.target.value })} className={inputCls} />
                    <input placeholder="APR %" value={loanDraft.rate} onChange={(e) => setLoanDraft({ ...loanDraft, rate: e.target.value })} className={inputCls} />
                    <input placeholder="Monthly" value={loanDraft.monthly} onChange={(e) => setLoanDraft({ ...loanDraft, monthly: e.target.value })} className={inputCls} />
                  </div>
                  <button onClick={addLoan} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    <Plus size={14} /> Add loan
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all"
            >
              <ArrowLeft size={14} /> Back
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed[step]}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40"
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={finish}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all"
              >
                <Sparkles size={14} /> Launch Dashboard
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can always update these settings later in your dashboard.
        </p>
      </motion.div>
    </div>
  );
}
