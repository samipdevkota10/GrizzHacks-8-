"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase,
  Target,
  Wallet,
  CreditCard,
  Building2,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Plus,
  X,
  DollarSign,
  Loader2,
} from "lucide-react";
import {
  submitOnboarding,
  getUserId,
  getToken,
  fetchOnboardingDraft,
  saveOnboardingDraft,
  plaidSandboxBootstrap,
  syncPlaid,
} from "@/lib/api";
import type { OnboardingPayload } from "@/lib/api";

const STEPS = [
  { label: "Income", icon: Briefcase },
  { label: "Budget", icon: Wallet },
  { label: "Goals", icon: Target },
  { label: "Accounts", icon: Building2 },
  { label: "Cards", icon: CreditCard },
  { label: "Loans", icon: FileText },
];

const GOAL_PRESETS = [
  { id: "emergency", label: "Build Emergency Fund", defaultTarget: 10000 },
  { id: "vacation", label: "Save for Vacation", defaultTarget: 3000 },
  { id: "debt", label: "Pay Off Debt", defaultTarget: 5000 },
  { id: "car", label: "Buy a Car", defaultTarget: 15000 },
  { id: "house", label: "Save for Down Payment", defaultTarget: 50000 },
  { id: "invest", label: "Start Investing", defaultTarget: 5000 },
  { id: "retire", label: "Retirement Savings", defaultTarget: 100000 },
  { id: "education", label: "Education Fund", defaultTarget: 10000 },
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-Time Employee" },
  { value: "part_time", label: "Part-Time Employee" },
  { value: "self_employed", label: "Self-Employed / Freelancer" },
  { value: "student", label: "Student" },
  { value: "retired", label: "Retired" },
  { value: "unemployed", label: "Currently Not Working" },
];

const PAY_FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every Two Weeks" },
  { value: "semimonthly", label: "Twice a Month" },
  { value: "monthly", label: "Monthly" },
];

type GoalEntry = { id: string; name: string; target_amount: string; current_amount: string };
type AccountEntry = { name: string; type: string; balance: string; institution: string };
type CardEntry = { name: string; last4: string; type: "credit" | "debit" };
type LoanEntry = { name: string; balance: string; rate: string; monthly: string; lender: string };

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [draftLoading, setDraftLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncingBank, setSyncingBank] = useState(false);
  const [bankSyncMessage, setBankSyncMessage] = useState("");
  const [error, setError] = useState("");

  // Step 0: Income & Employment
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [employerName, setEmployerName] = useState("");
  const [payFrequency, setPayFrequency] = useState("biweekly");
  const [hourlyRate, setHourlyRate] = useState("");
  const [taxRate, setTaxRate] = useState("22");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Step 1: Budget
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");

  // Step 2: Goals
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [selectedGoalPresets, setSelectedGoalPresets] = useState<Set<string>>(new Set());

  // Step 3: Accounts
  const [accounts, setAccounts] = useState<AccountEntry[]>([]);
  const [accountDraft, setAccountDraft] = useState<AccountEntry>({ name: "", type: "checking", balance: "", institution: "" });

  // Step 4: Cards
  const [cards, setCards] = useState<CardEntry[]>([]);
  const [cardDraft, setCardDraft] = useState<CardEntry>({ name: "", last4: "", type: "debit" });

  // Step 5: Loans
  const [loans, setLoans] = useState<LoanEntry[]>([]);
  const [loanDraft, setLoanDraft] = useState<LoanEntry>({ name: "", balance: "", rate: "", monthly: "", lender: "" });

  const buildDraftPayload = () => ({
    monthlyIncome,
    employmentType,
    employerName,
    payFrequency,
    hourlyRate,
    taxRate,
    phoneNumber,
    monthlyBudget,
    savingsGoal,
    goals,
    selectedGoalPresets: Array.from(selectedGoalPresets),
    accounts,
    cards,
    loans,
  });

  useEffect(() => {
    const uid = getUserId();
    const token = getToken();
    if (!uid || !token) {
      window.location.href = "/auth";
      return;
    }
    fetchOnboardingDraft()
      .then((draft) => {
        const data = (draft?.data || {}) as Record<string, unknown>;
        if (typeof draft?.step === "number" && draft.step >= 0 && draft.step < STEPS.length) {
          setStep(draft.step);
        }
        if (typeof data.monthlyIncome === "string") setMonthlyIncome(data.monthlyIncome);
        if (typeof data.employmentType === "string") setEmploymentType(data.employmentType);
        if (typeof data.employerName === "string") setEmployerName(data.employerName);
        if (typeof data.payFrequency === "string") setPayFrequency(data.payFrequency);
        if (typeof data.hourlyRate === "string") setHourlyRate(data.hourlyRate);
        if (typeof data.taxRate === "string") setTaxRate(data.taxRate);
        if (typeof data.phoneNumber === "string") setPhoneNumber(data.phoneNumber);
        if (typeof data.monthlyBudget === "string") setMonthlyBudget(data.monthlyBudget);
        if (typeof data.savingsGoal === "string") setSavingsGoal(data.savingsGoal);
        if (Array.isArray(data.goals)) setGoals(data.goals as GoalEntry[]);
        if (Array.isArray(data.accounts)) setAccounts(data.accounts as AccountEntry[]);
        if (Array.isArray(data.cards)) setCards(data.cards as CardEntry[]);
        if (Array.isArray(data.loans)) setLoans(data.loans as LoanEntry[]);
        if (Array.isArray(data.selectedGoalPresets)) {
          setSelectedGoalPresets(new Set((data.selectedGoalPresets as string[]).filter(Boolean)));
        }
      })
      .finally(() => setDraftLoading(false));
  }, []);

  const persistDraft = async (nextStep: number) => {
    try {
      await saveOnboardingDraft(nextStep, buildDraftPayload());
    } catch (e) {
      console.error("Failed to save draft:", e);
    }
  };

  const toggleGoalPreset = (preset: typeof GOAL_PRESETS[0]) => {
    const next = new Set(selectedGoalPresets);
    if (next.has(preset.id)) {
      next.delete(preset.id);
      setGoals((g) => g.filter((x) => x.id !== preset.id));
    } else {
      next.add(preset.id);
      setGoals((g) => [...g, { id: preset.id, name: preset.label, target_amount: String(preset.defaultTarget), current_amount: "0" }]);
    }
    setSelectedGoalPresets(next);
  };

  const updateGoalTarget = (id: string, target: string) => {
    setGoals((g) => g.map((x) => (x.id === id ? { ...x, target_amount: target } : x)));
  };

  const updateGoalCurrent = (id: string, current: string) => {
    setGoals((g) => g.map((x) => (x.id === id ? { ...x, current_amount: current } : x)));
  };

  const addAccount = () => {
    if (!accountDraft.name) return;
    setAccounts((a) => [...a, accountDraft]);
    setAccountDraft({ name: "", type: "checking", balance: "", institution: "" });
  };

  const addCard = () => {
    if (!cardDraft.name || !cardDraft.last4) return;
    setCards((c) => [...c, cardDraft]);
    setCardDraft({ name: "", last4: "", type: "debit" });
  };

  const addLoan = () => {
    if (!loanDraft.name || !loanDraft.balance) return;
    setLoans((l) => [...l, loanDraft]);
    setLoanDraft({ name: "", balance: "", rate: "", monthly: "", lender: "" });
  };

  const connectSandboxBank = async () => {
    setSyncingBank(true);
    setBankSyncMessage("");
    setError("");
    try {
      const res = await plaidSandboxBootstrap();
      await syncPlaid();
      setBankSyncMessage(
        `Connected sandbox bank. Imported ${res.accounts_imported} accounts, ${res.transactions_imported} transactions, and detected ${res.subscriptions_detected} subscriptions.`
      );
      await persistDraft(step);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect bank.");
    } finally {
      setSyncingBank(false);
    }
  };

  const canProceed = [
    parseFloat(monthlyIncome) > 0,
    true,
    true,
    true,
    true,
    true,
  ];

  const finish = async () => {
    const uid = getUserId();
    const token = getToken();
    if (!uid || !token) {
      window.location.href = "/auth";
      return;
    }

    setSubmitting(true);
    setError("");

    const income = parseFloat(monthlyIncome) || 0;
    const budget = parseFloat(monthlyBudget) || income * 0.7;

    const payload: OnboardingPayload = {
      monthly_income: income,
      employment_type: employmentType,
      employer_name: employerName,
      pay_frequency: payFrequency,
      hourly_rate: parseFloat(hourlyRate) || 0,
      tax_rate: (parseFloat(taxRate) || 22) / 100,
      monthly_budget: budget,
      savings_goal_monthly: parseFloat(savingsGoal) || 0,
      phone_number: phoneNumber,
      currency: "USD",
      financial_goals: goals.map((g) => ({
        name: g.name,
        target_amount: parseFloat(g.target_amount) || 0,
        current_amount: parseFloat(g.current_amount) || 0,
      })),
      category_budgets: {},
      accounts: accounts.map((a) => ({
        name: a.name,
        type: a.type,
        balance: parseFloat(a.balance) || 0,
        institution: a.institution,
      })),
      cards: cards.map((c) => ({
        name: c.name,
        last4: c.last4,
        type: c.type,
      })),
      loans: loans.map((l) => ({
        name: l.name,
        balance: parseFloat(l.balance) || 0,
        rate: parseFloat(l.rate) || 0,
        monthly: parseFloat(l.monthly) || 0,
        lender: l.lender,
      })),
    };

    try {
      await persistDraft(step);
      await submitOnboarding(payload);
      window.location.href = "/dashboard";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-xl bg-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
  const selectCls = inputCls;

  if (draftLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Restoring onboarding progress...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-warm via-background to-light-accent/20" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Progress */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle2 size={18} /> : <s.icon size={16} />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 rounded-full transition-all ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
        </div>

        <div className="rounded-3xl bg-card border border-border p-8 shadow-sm">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500 mb-6">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 0: Income & Employment */}
            {step === 0 && (
              <motion.div key="income" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-foreground mb-1">Tell us about your income</h2>
                <p className="text-sm text-muted-foreground mb-6">This helps us calculate how many work-hours purchases cost you and personalize budgets.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Employment Status</label>
                    <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={selectCls}>
                      {EMPLOYMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {(employmentType === "full_time" || employmentType === "part_time") && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Employer (optional)</label>
                      <input placeholder="e.g. Google, Walmart" value={employerName} onChange={(e) => setEmployerName(e.target.value)} className={inputCls} />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Monthly Income (after tax) *</label>
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="number"
                          placeholder="4,800"
                          value={monthlyIncome}
                          onChange={(e) => setMonthlyIncome(e.target.value)}
                          className={`${inputCls} pl-8`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">How often are you paid?</label>
                      <select value={payFrequency} onChange={(e) => setPayFrequency(e.target.value)} className={selectCls}>
                        {PAY_FREQUENCIES.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Hourly Rate (pre-tax, optional)</label>
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="number" placeholder="30" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className={`${inputCls} pl-8`} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tax Rate %</label>
                      <input type="number" placeholder="22" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone Number (for fraud alerts, optional)</label>
                    <input type="tel" placeholder="+1 555-123-4567" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: Budget */}
            {step === 1 && (
              <motion.div key="budget" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-foreground mb-1">Set your budget</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  How much do you want to spend each month? We&apos;ll auto-split it across categories. You can adjust later.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Monthly Spending Budget</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        placeholder={monthlyIncome ? String(Math.round(parseFloat(monthlyIncome) * 0.7)) : "3,500"}
                        value={monthlyBudget}
                        onChange={(e) => setMonthlyBudget(e.target.value)}
                        className={`${inputCls} pl-8`}
                      />
                    </div>
                    {monthlyIncome && !monthlyBudget && (
                      <p className="text-xs text-muted-foreground mt-1">
                        We suggest ${Math.round(parseFloat(monthlyIncome) * 0.7).toLocaleString()} (70% of your income)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Monthly Savings Target</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        placeholder={monthlyIncome ? String(Math.round(parseFloat(monthlyIncome) * 0.2)) : "500"}
                        value={savingsGoal}
                        onChange={(e) => setSavingsGoal(e.target.value)}
                        className={`${inputCls} pl-8`}
                      />
                    </div>
                    {monthlyIncome && !savingsGoal && (
                      <p className="text-xs text-muted-foreground mt-1">
                        We suggest ${Math.round(parseFloat(monthlyIncome) * 0.2).toLocaleString()} (20% of your income)
                      </p>
                    )}
                  </div>

                  {monthlyIncome && (
                    <div className="rounded-xl bg-muted/50 p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Your money breakdown</p>
                      <div className="space-y-2">
                        {[
                          { label: "Budget", value: parseFloat(monthlyBudget) || parseFloat(monthlyIncome) * 0.7, color: "bg-primary" },
                          { label: "Savings", value: parseFloat(savingsGoal) || parseFloat(monthlyIncome) * 0.2, color: "bg-green-500" },
                          { label: "Remaining", value: Math.max(0, parseFloat(monthlyIncome) - (parseFloat(monthlyBudget) || parseFloat(monthlyIncome) * 0.7) - (parseFloat(savingsGoal) || parseFloat(monthlyIncome) * 0.2)), color: "bg-amber-400" },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                              <span className="text-muted-foreground">{item.label}</span>
                            </div>
                            <span className="font-medium text-foreground tabular-nums">${Math.round(item.value).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-foreground mb-1">What are you saving for?</h2>
                <p className="text-sm text-muted-foreground mb-6">Pick your goals and set target amounts. We&apos;ll track your progress and show how purchases impact them.</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {GOAL_PRESETS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => toggleGoalPreset(g)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                        selectedGoalPresets.has(g.id)
                          ? "border-primary bg-light-accent"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Target size={16} className={selectedGoalPresets.has(g.id) ? "text-primary" : "text-muted-foreground"} />
                      <span className="text-sm font-medium text-foreground">{g.label}</span>
                    </button>
                  ))}
                </div>

                {goals.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground">Set amounts for your goals:</p>
                    {goals.map((g) => (
                      <div key={g.id} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground w-48 truncate">{g.name}</span>
                        <div className="relative flex-1">
                          <DollarSign size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="number"
                            placeholder="Target"
                            value={g.target_amount}
                            onChange={(e) => updateGoalTarget(g.id, e.target.value)}
                            className="w-full rounded-lg bg-background border border-border pl-7 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        <div className="relative flex-1">
                          <DollarSign size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="number"
                            placeholder="Saved so far"
                            value={g.current_amount}
                            onChange={(e) => updateGoalCurrent(g.id, e.target.value)}
                            className="w-full rounded-lg bg-background border border-border pl-7 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Accounts */}
            {step === 3 && (
              <motion.div key="accounts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-foreground mb-1">Add your bank accounts</h2>
                <p className="text-sm text-muted-foreground mb-6">Checking, savings, investments — add what you have so Vera can give you accurate advice.</p>

                <div className="rounded-xl border border-border bg-warm p-4 mb-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Faster option: connect a sandbox bank to import real account + transaction history now.
                  </p>
                  <button
                    onClick={connectSandboxBank}
                    disabled={syncingBank}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    {syncingBank ? <Loader2 size={13} className="animate-spin" /> : <Building2 size={13} />}
                    {syncingBank ? "Connecting..." : "Connect Plaid Sandbox"}
                  </button>
                  {bankSyncMessage && <p className="text-xs text-green-600 mt-2">{bankSyncMessage}</p>}
                </div>

                {accounts.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {accounts.map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-warm border border-border">
                        <div className="flex items-center gap-3">
                          <Building2 size={16} className="text-primary" />
                          <div>
                            <span className="text-sm font-medium text-foreground">{a.name}</span>
                            {a.institution && <span className="text-xs text-muted-foreground ml-2">{a.institution}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-foreground tabular-nums">${parseFloat(a.balance || "0").toLocaleString()}</span>
                          <button onClick={() => setAccounts((as) => as.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 p-4 rounded-xl bg-background border border-border">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Account name (e.g. Chase Checking)" value={accountDraft.name} onChange={(e) => setAccountDraft({ ...accountDraft, name: e.target.value })} className={inputCls} />
                    <input placeholder="Bank / Institution" value={accountDraft.institution} onChange={(e) => setAccountDraft({ ...accountDraft, institution: e.target.value })} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={accountDraft.type} onChange={(e) => setAccountDraft({ ...accountDraft, type: e.target.value })} className={selectCls}>
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="investment">Investment</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="number" placeholder="Current balance" value={accountDraft.balance} onChange={(e) => setAccountDraft({ ...accountDraft, balance: e.target.value })} className={`${inputCls} pl-8`} />
                    </div>
                  </div>
                  <button onClick={addAccount} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    <Plus size={14} /> Add account
                  </button>
                </div>

                {accounts.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">You can skip this and add accounts later.</p>
                )}
              </motion.div>
            )}

            {/* Step 4: Cards */}
            {step === 4 && (
              <motion.div key="cards" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-foreground mb-1">Add your credit & debit cards</h2>
                <p className="text-sm text-muted-foreground mb-6">We&apos;ll track spending per card and help detect subscription creep.</p>

                {cards.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {cards.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-warm border border-border">
                        <div className="flex items-center gap-3">
                          <CreditCard size={16} className="text-primary" />
                          <span className="text-sm font-medium text-foreground">{c.name}</span>
                          <span className="text-xs text-muted-foreground">••••{c.last4}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{c.type}</span>
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
                    <select value={cardDraft.type} onChange={(e) => setCardDraft({ ...cardDraft, type: e.target.value as "credit" | "debit" })} className={selectCls}>
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <button onClick={addCard} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    <Plus size={14} /> Add card
                  </button>
                </div>

                {cards.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">You can skip this and add cards later.</p>
                )}
              </motion.div>
            )}

            {/* Step 5: Loans */}
            {step === 5 && (
              <motion.div key="loans" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-foreground mb-1">Any loans or debts?</h2>
                <p className="text-sm text-muted-foreground mb-6">Student loans, car payments, mortgage, credit card debt — add them so Vera can factor them into your financial plan.</p>

                {loans.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {loans.map((l, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-warm border border-border">
                        <div>
                          <span className="text-sm font-medium text-foreground">{l.name}</span>
                          {l.lender && <span className="text-xs text-muted-foreground ml-2">({l.lender})</span>}
                          <span className="text-xs text-muted-foreground ml-2">${parseFloat(l.balance || "0").toLocaleString()} at {l.rate}%</span>
                        </div>
                        <button onClick={() => setLoans((ls) => ls.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 p-4 rounded-xl bg-background border border-border">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Loan name (e.g. Student Loan)" value={loanDraft.name} onChange={(e) => setLoanDraft({ ...loanDraft, name: e.target.value })} className={inputCls} />
                    <input placeholder="Lender (e.g. SoFi)" value={loanDraft.lender} onChange={(e) => setLoanDraft({ ...loanDraft, lender: e.target.value })} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="number" placeholder="Balance" value={loanDraft.balance} onChange={(e) => setLoanDraft({ ...loanDraft, balance: e.target.value })} className={`${inputCls} pl-8`} />
                    </div>
                    <input type="number" placeholder="APR %" value={loanDraft.rate} onChange={(e) => setLoanDraft({ ...loanDraft, rate: e.target.value })} className={inputCls} />
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="number" placeholder="Monthly" value={loanDraft.monthly} onChange={(e) => setLoanDraft({ ...loanDraft, monthly: e.target.value })} className={`${inputCls} pl-8`} />
                    </div>
                  </div>
                  <button onClick={addLoan} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    <Plus size={14} /> Add loan
                  </button>
                </div>

                {loans.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">No debts? Lucky you! Skip ahead.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              onClick={async () => {
                const next = Math.max(0, step - 1);
                await persistDraft(next);
                setStep(next);
              }}
              disabled={step === 0}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all"
            >
              <ArrowLeft size={14} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={async () => {
                  const next = Math.min(STEPS.length - 1, step + 1);
                  await persistDraft(next);
                  setStep(next);
                }}
                disabled={!canProceed[step]}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40"
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={submitting}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Setting up...</>
                ) : (
                  <><Sparkles size={14} /> Launch Dashboard</>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can always update these settings later in your dashboard.
        </p>
        <div className="text-center mt-2">
          <button
            onClick={async () => {
              await persistDraft(step);
              window.location.href = "/auth";
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Save and continue later
          </button>
        </div>
      </motion.div>
    </div>
  );
}
