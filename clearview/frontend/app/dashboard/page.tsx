"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Shield,
  Plane,
  GraduationCap,
  Target,
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
  type DashboardData,
  type Transaction,
  type UpcomingBill,
  type ActionItem,
} from "@/lib/api";
import { DailySnapshotBanner } from "@/components/dashboard/DailySnapshotBanner";
import { ActionCenterCard } from "@/components/dashboard/ActionCenterCard";
import { BudgetPulseCard } from "@/components/dashboard/BudgetPulseCard";
import { BillsRiskCard } from "@/components/dashboard/BillsRiskCard";

const CATEGORY_COLORS: Record<string, string> = {
  food: "#F97316",
  transport: "#FBBF24",
  entertainment: "#7C3AED",
  shopping: "#DC2626",
  health: "#16A34A",
  utilities: "#E53E0B",
  subscription: "#A16207",
  subscriptions: "#A16207",
  income: "#16A34A",
  other: "#94A3B8",
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

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) { setLoading(false); return; }
    fetchDashboard(uid)
      .then(setData)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("404") || msg.includes("401")) {
          clearAuth();
          window.location.href = "/auth";
        }
      })
      .finally(() => setLoading(false));
  }, []);

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

  const monthlyTrend: { month: string; income: number; spending: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = monthNames[d.getMonth()];
    const monthTx = recent_transactions.filter((tx) => {
      const txd = new Date(tx.date);
      return txd.getMonth() === d.getMonth() && txd.getFullYear() === d.getFullYear();
    });
    const income = monthTx.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
    const spending = monthTx.filter((tx) => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);
    monthlyTrend.push({ month: label, income: Math.round(income), spending: Math.round(spending) });
  }

  const handleActionClick = (action: ActionItem) => {
    const uid = getUserId();
    if (uid) {
      postDashboardEvent(uid, "action_click", { action_id: action.id, action_type: action.type }).catch(() => {});
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good morning, {userName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s your financial overview for {monthNames[now.getMonth()]} {now.getFullYear()}
        </p>
      </div>

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
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #E8E4E0", fontSize: 12 }}
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
                      stroke="#FFFFFF"
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
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
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
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{cat.name}</span>
                    <span className={`text-xs font-medium tabular-nums ${over ? "text-red-500" : "text-foreground"}`}>
                      ${Math.round(cat.spent)} / ${cat.budget}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: over ? "#DC2626" : cat.color,
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

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Financial Goals</h3>
            <a href="/dashboard/goals" className="text-xs text-primary hover:underline">View all →</a>
          </div>
          {financialGoals.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {financialGoals.map((goal) => {
                const current = goal.current_amount ?? 0;
                const target = goal.target_amount ?? 0;
                const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                const GoalIcon = GOAL_ICON_MAP[goal.icon || "Target"] || Target;
                return (
                  <div key={goal.name}>
                    <div className="flex items-center gap-2 mb-1">
                      <GoalIcon size={18} className="text-primary" />
                      <span className="text-sm font-medium text-foreground flex-1">{goal.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground tabular-nums">${current.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">${target.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Target size={32} className="mx-auto mb-2 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No financial goals set yet.</p>
              <a href="/dashboard/goals" className="text-xs text-primary hover:underline mt-1 inline-block">Set goals →</a>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Upcoming Bills</h3>
            <DollarSign size={16} className="text-muted-foreground" />
          </div>
          <div className="space-y-1">
            {upcoming_bills.map((bill) => (
              <div key={bill.name} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{bill.name}</p>
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    Due {bill.date ? new Date(bill.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground tabular-nums">${bill.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
            {upcoming_bills.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming bills</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
