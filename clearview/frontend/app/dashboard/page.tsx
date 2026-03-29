"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  ShieldAlert,
  ShieldOff,
  Plane,
  GraduationCap,
  Target,
  Loader2,
  UtensilsCrossed,
  Car,
  Gamepad2,
  ShoppingBag,
  Heart,
  Lightbulb,
  Smartphone,
  CircleDollarSign,
  Package,
  type LucideIcon,
} from "lucide-react";
import { MerchantLogo } from "@/components/MerchantLogo";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getUserId,
  clearAuth,
  fetchDashboard,
  postDashboardEvent,
  fetchMonthlyTrend,
  fetchFraudAlerts,
  triggerTestFraud,
  type DashboardData,
  type ActionItem,
  type FraudAlert,
} from "@/lib/api";
import { DailySnapshotBanner } from "@/components/dashboard/DailySnapshotBanner";
import { ActionCenterCard } from "@/components/dashboard/ActionCenterCard";
import { BudgetPulseCard } from "@/components/dashboard/BudgetPulseCard";
import { BillsRiskCard } from "@/components/dashboard/BillsRiskCard";
import { CardOptimizerWidget } from "@/components/dashboard/CardOptimizerWidget";
import { SpendingPredictionCard } from "@/components/dashboard/SpendingPredictionCard";
import { CashFlowForecast } from "@/components/dashboard/CashFlowForecast";
import { FraudAlertBanner } from "@/components/dashboard/FraudAlertBanner";
import { useChartColors } from "@/lib/useChartColors";

const CATEGORY_COLORS: Record<string, string> = {
  food: "#C2410C",
  transport: "#B45309",
  entertainment: "#6D28D9",
  shopping: "#9F1239",
  health: "#15803D",
  utilities: "#1E6A8A",
  subscription: "#7E22CE",
  subscriptions: "#7E22CE",
  income: "#15803D",
  other: "#64748B",
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  transport: Car,
  entertainment: Gamepad2,
  shopping: ShoppingBag,
  health: Heart,
  utilities: Lightbulb,
  subscription: Smartphone,
  subscriptions: Smartphone,
  income: CircleDollarSign,
  other: Package,
};

function StatCard({
  label,
  value,
  change,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={16} className="text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>
        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change}
      </div>
    </div>
  );
}

function TxStatusBadge({ status, anomalyFlag }: { status?: string; anomalyFlag?: boolean }) {
  if (status === "denied")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
        <ShieldOff size={10} /> Blocked
      </span>
    );
  if (status === "pending_review")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
        <ShieldAlert size={10} /> Pending
      </span>
    );
  if (anomalyFlag)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
        <ShieldAlert size={10} /> Flagged
      </span>
    );
  return null;
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; income: number; spending: number }[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [testingFraud, setTestingFraud] = useState(false);
  const [testFraudResult, setTestFraudResult] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chartColors = useChartColors();

  const refreshFraudAlerts = useCallback(async (uid: string) => {
    try {
      const res = await fetchFraudAlerts(uid);
      setFraudAlerts(res.fraud_alerts || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) { setLoading(false); return; }
    fetchDashboard(uid)
      .then((d) => {
        setData(d);
        setFraudAlerts(d.fraud_alerts || []);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("404") || msg.includes("401")) {
          clearAuth();
          window.location.href = "/auth";
        }
      })
      .finally(() => setLoading(false));
    fetchMonthlyTrend(uid)
      .then((res) => setMonthlyTrend(res.trend))
      .catch(() => {});

    // Poll fraud alerts every 8 seconds (only when tab is visible) to pick up call status changes live
    const startPoll = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        if (!document.hidden) refreshFraudAlerts(uid);
      }, 8000);
    };
    startPoll();
    document.addEventListener("visibilitychange", startPoll);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", startPoll);
    };
  }, [refreshFraudAlerts]);

  const handleTestFraud = async () => {
    setTestingFraud(true);
    setTestFraudResult(null);
    try {
      const result = await triggerTestFraud() as {
        call_result?: { success?: boolean; mock?: boolean; message?: string; status_code?: number };
        call_error?: string;
        detection_risk_score?: number;
        detection_severity?: string;
        fraud_alert_id?: string;
      };
      const callRes = result.call_result || {};
      if (result.call_error) {
        setTestFraudResult(`Error: ${result.call_error}`);
      } else if (callRes.success === false) {
        setTestFraudResult(`Call failed (${callRes.status_code || "?"}): ${callRes.message}`);
      } else if (callRes.mock) {
        setTestFraudResult("ElevenLabs not configured — mock call triggered. Check backend logs.");
      } else {
        setTestFraudResult(`Call initiated! Risk: ${result.detection_risk_score}/100 (${result.detection_severity}). Alert ID: ${result.fraud_alert_id?.slice(-8)}`);
      }
      // Refresh fraud alerts immediately after test
      const uid = getUserId();
      if (uid) await refreshFraudAlerts(uid);
    } catch (e) {
      setTestFraudResult(`Request failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setTestingFraud(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" suppressHydrationWarning>
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" suppressHydrationWarning />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Could not load dashboard data. Make sure the backend is running and the user ID is set.</p>
      </div>
    );
  }

  const userName = (data.user as { name?: string }).name || "User";
  const profile = data.financial_profile as {
    monthly_income?: number;
    monthly_budget?: number;
    net_worth?: number;
    total_assets?: number;
    total_liabilities?: number;
    savings_goal_monthly?: number;
    financial_goals?: { name: string; target_amount: number; current_amount: number; icon?: string }[];
    category_budgets?: Record<string, number>;
  } | null;

  const { monthly_summary: ms, quick_stats: qs, upcoming_bills, recent_transactions } = data;
  const savingsRate = ms.income > 0 ? Math.round(((ms.income - ms.spent) / ms.income) * 100 * 10) / 10 : 0;
  const savings = ms.income - ms.spent;

  const spendingByCategory = Object.entries(ms.by_category)
    .filter(([cat]) => cat !== "income")
    .map(([name, amount]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount,
      color: CATEGORY_COLORS[name.toLowerCase()] || "#94A3B8",
      percent: ms.spent > 0 ? Math.round((amount / ms.spent) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const budgetCategories = profile?.category_budgets
    ? Object.entries(profile.category_budgets).map(([name, budget]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        budget,
        spent: ms.by_category[name] || 0,
        color: CATEGORY_COLORS[name.toLowerCase()] || "#94A3B8",
      }))
    : [];

  const financialGoals = profile?.financial_goals || [];
  const GOAL_ICON_MAP: Record<string, React.ElementType> = { Shield, Plane, GraduationCap, Target };

  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handleActionClick = (action: ActionItem) => {
    const uid = getUserId();
    if (uid) {
      postDashboardEvent(uid, "action_click", { action_id: action.id, action_type: action.type }).catch(() => {});
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" suppressHydrationWarning>
          {greeting}, {userName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s your financial overview for {monthNames[now.getMonth()]} {now.getFullYear()}
        </p>
      </div>

      {fraudAlerts.length > 0 && (
        <FraudAlertBanner
          alerts={fraudAlerts}
          onResolved={() => {
            const uid = getUserId();
            if (uid) refreshFraudAlerts(uid);
          }}
        />
      )}

      {/* Demo fraud test button — only shown when no active alerts */}
      {fraudAlerts.filter((a) => a.status !== "resolved").length === 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border bg-muted/30">
          <ShieldAlert size={15} className="text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">Demo: trigger a mock fraudulent transaction to test the Vera call system.</p>
          <button
            onClick={handleTestFraud}
            disabled={testingFraud}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {testingFraud ? <Loader2 size={12} className="animate-spin" /> : <ShieldAlert size={12} />}
            {testingFraud ? "Triggering…" : "Simulate Fraud"}
          </button>
          {testFraudResult && (
            <span className={`text-[10px] font-medium max-w-xs truncate ${testFraudResult.startsWith("Call initiated") ? "text-green-600" : "text-red-500"}`}>
              {testFraudResult}
            </span>
          )}
        </div>
      )}

      {data.daily_snapshot && <DailySnapshotBanner snapshot={data.daily_snapshot} />}

      {data.action_center && data.action_center.length > 0 && (
        <ActionCenterCard actions={data.action_center} onActionClick={handleActionClick} />
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Net Worth"
          value={`$${(data.net_worth || 0).toLocaleString()}`}
          change={`Assets: $${(profile?.total_assets || 0).toLocaleString()}`}
          positive
          icon={Wallet}
        />
        <StatCard
          label="Monthly Income"
          value={`$${ms.income.toLocaleString()}`}
          change={`Budget: $${ms.budget.toLocaleString()}`}
          positive
          icon={ArrowDownLeft}
        />
        <StatCard
          label="Monthly Spending"
          value={`$${ms.spent.toLocaleString()}`}
          change={`$${ms.remaining.toLocaleString()} remaining`}
          positive={ms.remaining >= 0}
          icon={ArrowUpRight}
        />
        <StatCard
          label="Savings Rate"
          value={`${savingsRate}%`}
          change={`$${savings.toLocaleString()} saved`}
          positive={savings >= 0}
          icon={PiggyBank}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-2xl bg-card border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Income vs Spending</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E53E0B" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#E53E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: chartColors.axis }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: chartColors.axis }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: `1px solid ${chartColors.tooltipBorder}`, fontSize: 12, backgroundColor: chartColors.tooltipBg }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
              />
              <Area type="monotone" dataKey="income" stroke="#16A34A" fill="url(#incomeGrad)" strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="spending" stroke="#E53E0B" fill="url(#spendingGrad)" strokeWidth={2} name="Spending" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-card border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Spending Breakdown</h3>
          {spendingByCategory.length > 0 ? (
            <>
              <div className="flex justify-center mb-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      dataKey="amount"
                      strokeWidth={2}
                      stroke={chartColors.pieStroke}
                    >
                      {spendingByCategory.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {spendingByCategory.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {(() => { const Icon = CATEGORY_ICONS[cat.name.toLowerCase()] || Package; return <Icon size={12} className="text-muted-foreground" />; })()}
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="font-medium text-foreground tabular-nums">${cat.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No spending data yet</p>
          )}
        </div>
      </div>

      {(data.budget_pulse || data.bill_risk) && (
        <div className="grid grid-cols-2 gap-4">
          {data.budget_pulse && (
            <BudgetPulseCard pulse={data.budget_pulse} budget={ms.budget} />
          )}
          {data.bill_risk && <BillsRiskCard risk={data.bill_risk} />}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <SpendingPredictionCard />
        <CashFlowForecast />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Budget Progress</h3>
            <span className="text-xs text-muted-foreground">
              ${ms.spent.toLocaleString()} / ${ms.budget.toLocaleString()}
            </span>
          </div>
          <div className="space-y-3">
            {budgetCategories.map((cat) => {
              const pct = cat.budget > 0 ? Math.min((cat.spent / cat.budget) * 100, 100) : 0;
              const over = cat.spent > cat.budget;
              const CatIcon = CATEGORY_ICONS[cat.name.toLowerCase()] || Package;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <CatIcon size={12} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className={`text-xs font-medium tabular-nums ${over ? "text-primary" : "text-foreground"}`}>
                      ${Math.round(cat.spent)} / ${cat.budget}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: over ? "var(--color-primary)" : cat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-2 rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Recent Transactions</h3>
            <a href="/dashboard/transactions" className="text-xs text-primary hover:underline">View all →</a>
          </div>
          <div className="space-y-1">
            {recent_transactions.slice(0, 7).map((tx) => {
              const domain = tx.merchant_logo_url || null;
              return (
                <div key={tx._id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <MerchantLogo domain={domain} name={tx.merchant_name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.merchant_name}</p>
                    <p className="text-xs text-muted-foreground">{tx.category}</p>
                  </div>
                  <TxStatusBadge status={tx.status} anomalyFlag={tx.anomaly_flag} />
                  <div className="text-right">
                    <p className={`text-sm font-medium tabular-nums ${tx.amount > 0 ? "text-green-600" : "text-foreground"}`}>
                      {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
            {recent_transactions.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
            )}
          </div>
        </div>
      </div>

      {financialGoals.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Financial Goals</h3>
            <a href="/dashboard/goals" className="text-xs text-primary hover:underline">View all →</a>
          </div>
          <div className={`grid gap-4 ${financialGoals.length === 1 ? "grid-cols-1" : financialGoals.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {financialGoals.map((goal) => {
              const current = goal.current_amount ?? 0;
              const target = goal.target_amount ?? 0;
              const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              const remaining = Math.max(0, target - current);
              const GoalIcon = GOAL_ICON_MAP[goal.icon || "Target"] || Target;
              const monthlySavingsGoal = profile?.savings_goal_monthly || 0;
              const monthsLeft = monthlySavingsGoal > 0 ? Math.ceil(remaining / monthlySavingsGoal) : null;
              return (
                <div key={goal.name} className="rounded-xl bg-muted/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GoalIcon size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{goal.name}</p>
                      <p className="text-xs text-muted-foreground">{pct}% complete</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground tabular-nums">${current.toLocaleString()} of ${target.toLocaleString()}</span>
                    {monthsLeft != null && monthsLeft < 999 && (
                      <span className="text-[10px] text-muted-foreground">~{monthsLeft} mo left</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Financial Pulse</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Daily Spend</p>
              <p className="text-lg font-bold text-foreground tabular-nums">${qs.avg_daily_spend.toFixed(0)}<span className="text-xs font-normal text-muted-foreground">/day</span></p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Top Category</p>
              <div className="flex items-center gap-2 mt-0.5">
                {(() => { const TopIcon = CATEGORY_ICONS[qs.top_category.toLowerCase()] || Package; return <TopIcon size={14} className="text-muted-foreground" />; })()}
                <p className="text-sm font-medium text-foreground">{qs.top_category.charAt(0).toUpperCase() + qs.top_category.slice(1)}</p>
                <span className="text-xs text-muted-foreground tabular-nums ml-auto">${qs.top_category_amount.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Subscriptions</p>
              <p className="text-sm font-medium text-foreground">{data.subscriptions.length} active · ${data.subscriptions.reduce((s, sub) => s + (sub.amount || 0), 0).toFixed(2)}/mo</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Days to Paycheck</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{qs.days_until_paycheck}<span className="text-xs font-normal text-muted-foreground"> days</span></p>
            </div>
          </div>
        </div>

        <div className="col-span-2 rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Upcoming Bills</h3>
            {upcoming_bills.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground tabular-nums">
                  Total: ${upcoming_bills.reduce((s, b) => s + b.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <a href="/dashboard/bills" className="text-xs text-primary hover:underline">View all →</a>
              </div>
            )}
          </div>
          {upcoming_bills.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4">
              {upcoming_bills.slice(0, 10).map((bill, i) => (
                <div key={`${bill.name}-${i}`} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                  <MerchantLogo domain={bill.logo_url || null} name={bill.name} size={24} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{bill.name}</p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      Due {bill.date ? new Date(bill.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-foreground tabular-nums ml-3">${bill.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming bills</p>
          )}
          {upcoming_bills.length > 10 && (
            <div className="mt-3 text-center">
              <a href="/dashboard/bills" className="text-xs text-primary hover:underline">
                +{upcoming_bills.length - 10} more bills →
              </a>
            </div>
          )}
        </div>
      </div>

      <CardOptimizerWidget />
    </div>
  );
}
