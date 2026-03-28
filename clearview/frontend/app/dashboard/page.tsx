"use client";

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
  USER,
  NET_WORTH,
  MONTHLY,
  SPENDING_BY_CATEGORY,
  MONTHLY_TREND,
  BUDGET_CATEGORIES,
  TRANSACTIONS,
  UPCOMING_BILLS,
  FINANCIAL_GOALS,
} from "@/lib/mock-data";

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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good morning, {USER.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s your financial overview for March 2026
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Net Worth"
          value={`$${NET_WORTH.total.toLocaleString()}`}
          change={`+$${NET_WORTH.change.toLocaleString()} (${NET_WORTH.changePercent}%)`}
          positive
          icon={Wallet}
        />
        <StatCard
          label="Monthly Income"
          value={`$${MONTHLY.income.toLocaleString()}`}
          change="+0% vs last month"
          positive
          icon={ArrowDownLeft}
        />
        <StatCard
          label="Monthly Spending"
          value={`$${MONTHLY.spending.toLocaleString()}`}
          change="-4.2% vs last month"
          positive
          icon={ArrowUpRight}
        />
        <StatCard
          label="Savings Rate"
          value={`${MONTHLY.savingsRate}%`}
          change={`$${MONTHLY.savings.toLocaleString()} saved`}
          positive
          icon={PiggyBank}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Monthly Trend */}
        <div className="col-span-2 rounded-2xl bg-card border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Income vs Spending</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={MONTHLY_TREND}>
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

        {/* Spending Breakdown */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Spending Breakdown</h3>
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={SPENDING_BY_CATEGORY}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="amount"
                  strokeWidth={2}
                  stroke="#FFFFFF"
                >
                  {SPENDING_BY_CATEGORY.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {SPENDING_BY_CATEGORY.slice(0, 5).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <span className="font-medium text-foreground tabular-nums">${cat.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget + Transactions Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Budget Progress */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Budget Progress</h3>
            <span className="text-xs text-muted-foreground">
              ${MONTHLY.budgetUsed.toLocaleString()} / ${MONTHLY.budgetTotal.toLocaleString()}
            </span>
          </div>
          <div className="space-y-3">
            {BUDGET_CATEGORIES.map((cat) => {
              const pct = Math.min((cat.spent / cat.budget) * 100, 100);
              const over = cat.spent > cat.budget;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{cat.name}</span>
                    <span className={`text-xs font-medium tabular-nums ${over ? "text-red-500" : "text-foreground"}`}>
                      ${cat.spent} / ${cat.budget}
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

        {/* Recent Transactions */}
        <div className="col-span-2 rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Recent Transactions</h3>
            <a href="/dashboard/transactions" className="text-xs text-primary hover:underline">View all →</a>
          </div>
          <div className="space-y-1">
            {TRANSACTIONS.slice(0, 7).map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                <MerchantLogo domain={tx.logo} name={tx.merchant} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.merchant}</p>
                  <p className="text-xs text-muted-foreground">{tx.category}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium tabular-nums ${tx.amount > 0 ? "text-green-600" : "text-foreground"}`}>
                    {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals + Bills Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Financial Goals */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Financial Goals</h3>
          <div className="space-y-4">
            {FINANCIAL_GOALS.map((goal) => {
              const pct = Math.round((goal.current / goal.target) * 100);
              const GoalIcon = { Shield, Plane, GraduationCap }[goal.icon];
              return (
                <div key={goal.name}>
                  <div className="flex items-center gap-2 mb-1">
                    {GoalIcon && <GoalIcon size={18} className="text-primary" />}
                    <span className="text-sm font-medium text-foreground flex-1">{goal.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground tabular-nums">${goal.current.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">${goal.target.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Bills */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Upcoming Bills</h3>
            <DollarSign size={16} className="text-muted-foreground" />
          </div>
          <div className="space-y-1">
            {UPCOMING_BILLS.map((bill) => (
              <div key={bill.name} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{bill.name}</p>
                  <p className="text-xs text-muted-foreground">Due {bill.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground tabular-nums">${bill.amount.toFixed(2)}</p>
                  {bill.autopay && (
                    <span className="text-[10px] text-green-600 font-medium">Autopay</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
