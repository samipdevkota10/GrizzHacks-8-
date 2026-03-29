"use client";

import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Target,
  Save,
  Loader2,
  CheckCircle2,
  Plus,
  X,
  RefreshCw,
} from "lucide-react";
import { getToken, getUserId } from "@/lib/api";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

interface FinancialGoal {
  name: string;
  target_amount: number;
  current_amount: number;
}

interface ProfileData {
  user: {
    _id: string;
    name: string;
    email: string;
    phone_number?: string;
    vera_name?: string;
    vera_personality?: string;
    onboarding_complete?: boolean;
    created_at?: string;
  };
  financial_profile: {
    monthly_income?: number;
    monthly_budget?: number;
    savings_goal_monthly?: number;
    hourly_rate?: number;
    tax_rate?: number;
    net_worth?: number;
    total_assets?: number;
    total_liabilities?: number;
    financial_goals?: FinancialGoal[];
  };
  accounts: {
    _id: string;
    name: string;
    type: string;
    balance: number;
    institution_name: string;
  }[];
}

const inputCls =
  "w-full rounded-xl bg-background border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // User fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [veraName, setVeraName] = useState("Vera");

  // Financial fields
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [taxRate, setTaxRate] = useState("");

  // Goals
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalCurrent, setNewGoalCurrent] = useState("0");

  useEffect(() => {
    const uid = getUserId();
    const token = getToken();
    if (!uid || !token) {
      window.location.href = "/auth";
      return;
    }
    fetch(`${API_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error("Failed to fetch profile");
        }
        return r.json();
      })
      .then((d: Partial<ProfileData>) => {
        const user = d?.user ?? ({} as ProfileData["user"]);
        const fp = d?.financial_profile ?? ({} as ProfileData["financial_profile"]);
        const normalized: ProfileData = {
          user,
          financial_profile: fp,
          accounts: Array.isArray(d?.accounts) ? d.accounts : [],
        };

        setData(normalized);
        setName(user.name || "");
        setPhone(user.phone_number || "");
        setVeraName(user.vera_name || "Vera");
        setMonthlyIncome(String(fp.monthly_income ?? ""));
        setMonthlyBudget(String(fp.monthly_budget ?? ""));
        setSavingsGoal(String(fp.savings_goal_monthly ?? ""));
        setHourlyRate(String(fp.hourly_rate ?? ""));
        setTaxRate(String(Math.round((fp.tax_rate ?? 0.22) * 100)));
        setGoals(fp.financial_goals || []);
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone_number: phone,
          vera_name: veraName,
          monthly_income: parseFloat(monthlyIncome) || 0,
          monthly_budget: parseFloat(monthlyBudget) || 0,
          savings_goal_monthly: parseFloat(savingsGoal) || 0,
          hourly_rate: parseFloat(hourlyRate) || 0,
          tax_rate: (parseFloat(taxRate) || 22) / 100,
          financial_goals: goals,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addGoal = () => {
    if (!newGoalName.trim()) return;
    setGoals((prev) => [
      ...prev,
      {
        name: newGoalName.trim(),
        target_amount: parseFloat(newGoalTarget) || 0,
        current_amount: parseFloat(newGoalCurrent) || 0,
      },
    ]);
    setNewGoalName("");
    setNewGoalTarget("");
    setNewGoalCurrent("0");
  };

  const removeGoal = (idx: number) => setGoals((g) => g.filter((_, i) => i !== idx));

  const updateGoal = (idx: number, field: keyof FinancialGoal, value: string) => {
    setGoals((g) =>
      g.map((goal, i) =>
        i === idx
          ? { ...goal, [field]: field === "name" ? value : parseFloat(value) || 0 }
          : goal
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const fp = data?.financial_profile;
  const netWorth = fp?.net_worth ?? 0;
  const totalAssets = fp?.total_assets ?? 0;
  const totalLiabilities = fp?.total_liabilities ?? 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal info and financial preferences
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={15} />
          ) : (
            <Save size={15} />
          )}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Net worth summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Net Worth", value: netWorth, color: netWorth >= 0 ? "text-green-500" : "text-red-500" },
          { label: "Total Assets", value: totalAssets, color: "text-foreground" },
          { label: "Total Liabilities", value: totalLiabilities, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl bg-card border border-border p-5">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-xl font-bold tabular-nums ${color}`}>
              ${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Personal Info */}
      <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <User size={16} className="text-primary" /> Personal Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Full Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} pl-9`} placeholder="Your name" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={data?.user?.email || ""} disabled className={`${inputCls} pl-9 opacity-50 cursor-not-allowed`} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Phone Number</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputCls} pl-9`} placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Vera's Name</label>
            <input value={veraName} onChange={(e) => setVeraName(e.target.value)} className={inputCls} placeholder="Vera" />
            <p className="text-[10px] text-muted-foreground mt-1">Your AI advisor's name</p>
          </div>
        </div>
        <div className="pt-1">
          <p className="text-xs text-muted-foreground">
            Member since{" "}
            {data?.user?.created_at
              ? new Date(data.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
              : "—"}
          </p>
        </div>
      </div>

      {/* Financial Profile */}
      <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <DollarSign size={16} className="text-primary" /> Financial Profile
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Monthly Income</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className={`${inputCls} pl-9`} placeholder="4800" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Monthly Budget</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="number" value={monthlyBudget} onChange={(e) => setMonthlyBudget(e.target.value)} className={`${inputCls} pl-9`} placeholder="3500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Monthly Savings Goal</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="number" value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)} className={`${inputCls} pl-9`} placeholder="500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Hourly Rate (after tax)</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className={`${inputCls} pl-9`} placeholder="30" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Tax Rate (%)</label>
            <div className="relative">
              <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={`${inputCls} pl-9`} placeholder="22" min="0" max="60" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Goals */}
      <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Target size={16} className="text-primary" /> Financial Goals
        </h2>

        {goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map((goal, idx) => {
              const pct = goal.target_amount > 0
                ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
                : 0;
              return (
                <div key={idx} className="p-4 rounded-xl bg-background border border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={goal.name}
                      onChange={(e) => updateGoal(idx, "name", e.target.value)}
                      className="flex-1 text-sm font-medium bg-transparent border-b border-border focus:outline-none focus:border-primary pb-0.5 text-foreground"
                    />
                    <button onClick={() => removeGoal(idx)} className="text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Current ($)</label>
                      <input
                        type="number"
                        value={goal.current_amount}
                        onChange={(e) => updateGoal(idx, "current_amount", e.target.value)}
                        className="w-full text-sm bg-transparent border-b border-border focus:outline-none focus:border-primary text-foreground pb-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Target ($)</label>
                      <input
                        type="number"
                        value={goal.target_amount}
                        onChange={(e) => updateGoal(idx, "target_amount", e.target.value)}
                        className="w-full text-sm bg-transparent border-b border-border focus:outline-none focus:border-primary text-foreground pb-0.5"
                      />
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">{pct}% complete</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No goals yet. Add one below.</p>
        )}

        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <p className="text-xs font-medium text-foreground">Add a new goal</p>
          <input
            value={newGoalName}
            onChange={(e) => setNewGoalName(e.target.value)}
            placeholder="Goal name (e.g. Emergency Fund)"
            className={inputCls}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="number"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                placeholder="Target amount"
                className={`${inputCls} pl-9`}
              />
            </div>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="number"
                value={newGoalCurrent}
                onChange={(e) => setNewGoalCurrent(e.target.value)}
                placeholder="Current amount"
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>
          <button
            onClick={addGoal}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus size={14} /> Add goal
          </button>
        </div>
      </div>

      {/* Linked Accounts (read-only) */}
      {data?.accounts && data.accounts.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Briefcase size={16} className="text-primary" /> Linked Accounts
          </h2>
          <div className="space-y-2">
            {data.accounts.map((acc) => (
              <div
                key={acc._id}
                className="flex items-center justify-between p-3 rounded-xl bg-background border border-border"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{acc.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {acc.type} · {acc.institution_name}
                  </p>
                </div>
                <p
                  className={`text-sm font-bold tabular-nums ${
                    acc.balance < 0 ? "text-red-400" : "text-foreground"
                  }`}
                >
                  {acc.balance < 0 ? "-" : ""}${Math.abs(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <RefreshCw size={11} /> Accounts can be re-configured by restarting the onboarding flow.
          </p>
        </div>
      )}

      {/* Redo onboarding */}
      <div className="rounded-2xl bg-card border border-border p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Re-run Onboarding</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update your full financial setup — income, accounts, loans, and goals.
          </p>
        </div>
        <button
          onClick={() => { window.location.href = "/onboarding"; }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw size={14} /> Re-run Setup
        </button>
      </div>
    </div>
  );
}
