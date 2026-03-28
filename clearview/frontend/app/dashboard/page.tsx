"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useAlerts } from "@/hooks/useAlerts";
import { useClearviewUserId } from "@/hooks/useClearviewUserId";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MissingUserIdHint } from "@/components/layout/MissingUserIdHint";
import { AnomalyAlert } from "@/components/alerts/AnomalyAlert";
import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { SpendingDonut } from "@/components/dashboard/SpendingDonut";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { BudgetProgress } from "@/components/dashboard/BudgetProgress";
import { SubscriptionGrid } from "@/components/dashboard/SubscriptionGrid";
import { TransactionFeed } from "@/components/dashboard/TransactionFeed";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { UpcomingBills } from "@/components/dashboard/UpcomingBills";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const CATEGORY_COLORS: Record<string, string> = {
  food: "#FF6B6B",
  transport: "#4ECDC4",
  entertainment: "#A78BFA",
  shopping: "#F7DC6F",
  health: "#00D26A",
  utilities: "#45B7D1",
  subscription: "#FF8C42",
  other: "#8B9CB6",
};

const MOCK_MONTHLY_DATA = [
  { month: "Oct", spending: 2800, income: 4800, value: 21200 },
  { month: "Nov", spending: 3100, income: 4800, value: 21900 },
  { month: "Dec", spending: 3400, income: 4800, value: 22300 },
  { month: "Jan", spending: 2900, income: 4800, value: 22800 },
  { month: "Feb", spending: 3200, income: 4800, value: 23100 },
  { month: "Mar", spending: 2100, income: 4800, value: 23400 },
];

export default function DashboardPage() {
  const { hydrated, userId } = useClearviewUserId();
  const { data, loading, error, refetch } = useDashboard(hydrated, userId);
  const { handleAction } = useAlerts(refetch);

  if (hydrated && !userId) {
    return (
      <DashboardLayout title="Dashboard" userId={userId}>
        <div className="flex min-h-[50vh] flex-col items-center justify-center py-12">
          <MissingUserIdHint />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard" userId={userId}>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="text-6xl mb-4 text-negative font-[family-name:var(--font-display)]">!</div>
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-text-secondary mb-4 max-w-md">
            Could not connect to the Clearview API. Make sure the backend is running on port 8000.
          </p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue-dim transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading || !data) {
    return (
      <DashboardLayout title="Dashboard" userId={userId}>
        <div className="space-y-6">
          <LoadingSkeleton className="h-16 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <LoadingSkeleton className="h-64 col-span-1" />
            <LoadingSkeleton className="h-64 col-span-1" />
            <LoadingSkeleton className="h-64 col-span-1" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton className="h-80" />
            <LoadingSkeleton className="h-80" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const spendingData = Object.entries(data.monthly_summary.by_category).map(
    ([category, amount]) => ({
      category,
      amount,
      color: CATEGORY_COLORS[category] || "#8B9CB6",
    })
  );

  return (
    <DashboardLayout
      title="Dashboard"
      userId={userId}
      alertCount={data.pending_alerts.length + data.notifications.length}
    >
      <div className="space-y-6">
        {data.pending_alerts.length > 0 && (
          <AnomalyAlert alerts={data.pending_alerts} onAction={handleAction} />
        )}

        <QuickStats
          avgDailySpend={data.quick_stats.avg_daily_spend}
          topCategory={data.quick_stats.top_category}
          topCategoryAmount={data.quick_stats.top_category_amount}
          daysUntilPaycheck={data.quick_stats.days_until_paycheck}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <NetWorthCard
            netWorth={data.net_worth}
            monthlyChange={1240}
            assets={data.financial_profile.total_assets}
            liabilities={data.financial_profile.total_liabilities}
            monthlyData={MOCK_MONTHLY_DATA}
          />
          <SpendingDonut data={spendingData} />
          <BudgetProgress
            spent={data.monthly_summary.spent}
            budget={data.monthly_summary.budget}
            byCategory={data.monthly_summary.by_category}
            categoryBudgets={data.financial_profile.category_budgets}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyTrendChart data={MOCK_MONTHLY_DATA} />
          <TransactionFeed transactions={data.recent_transactions.slice(0, 10)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SubscriptionGrid subscriptions={data.subscriptions} />
          <UpcomingBills bills={data.upcoming_bills} />
        </div>
      </div>
    </DashboardLayout>
  );
}
