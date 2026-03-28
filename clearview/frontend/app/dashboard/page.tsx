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
import { PageTransition } from "@/components/motion/PageTransition";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";

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
        <PageTransition>
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-negative/10 ring-1 ring-negative/20">
                <span className="text-4xl font-bold text-negative font-[family-name:var(--font-display)]">!</span>
              </div>
              <div className="absolute -inset-4 rounded-3xl bg-negative/5 blur-xl" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
            <p className="text-text-secondary mb-6 max-w-md">
              Could not connect to the Clearview API. Make sure the backend is running on port 8000.
            </p>
            <button
              onClick={refetch}
              className="group relative overflow-hidden px-6 py-3 bg-accent-blue text-white rounded-xl font-medium hover:bg-accent-blue/90 transition-all cursor-pointer hover:shadow-[0_0_30px_rgba(79,142,247,0.3)]"
            >
              Retry
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
          </div>
        </PageTransition>
      </DashboardLayout>
    );
  }

  if (loading || !data) {
    return (
      <DashboardLayout title="Dashboard" userId={userId}>
        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <LoadingSkeleton className="h-16 w-full" />
          </StaggerItem>
          <StaggerItem>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <LoadingSkeleton className="h-64 col-span-1" />
              <LoadingSkeleton className="h-64 col-span-1" />
              <LoadingSkeleton className="h-64 col-span-1" />
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LoadingSkeleton className="h-80" />
              <LoadingSkeleton className="h-80" />
            </div>
          </StaggerItem>
        </StaggerContainer>
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
      <PageTransition>
        <div className="space-y-6">
          {data.pending_alerts.length > 0 && (
            <AnimatedCard>
              <AnomalyAlert alerts={data.pending_alerts} onAction={handleAction} />
            </AnimatedCard>
          )}

          <AnimatedCard delay={0.05}>
            <QuickStats
              avgDailySpend={data.quick_stats.avg_daily_spend}
              topCategory={data.quick_stats.top_category}
              topCategoryAmount={data.quick_stats.top_category_amount}
              daysUntilPaycheck={data.quick_stats.days_until_paycheck}
            />
          </AnimatedCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AnimatedCard index={0} delay={0.15}>
              <NetWorthCard
                netWorth={data.net_worth}
                monthlyChange={1240}
                assets={data.financial_profile.total_assets}
                liabilities={data.financial_profile.total_liabilities}
                monthlyData={MOCK_MONTHLY_DATA}
              />
            </AnimatedCard>
            <AnimatedCard index={1} delay={0.15}>
              <SpendingDonut data={spendingData} />
            </AnimatedCard>
            <AnimatedCard index={2} delay={0.15}>
              <BudgetProgress
                spent={data.monthly_summary.spent}
                budget={data.monthly_summary.budget}
                byCategory={data.monthly_summary.by_category}
                categoryBudgets={data.financial_profile.category_budgets}
              />
            </AnimatedCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatedCard index={0} delay={0.35}>
              <MonthlyTrendChart data={MOCK_MONTHLY_DATA} />
            </AnimatedCard>
            <AnimatedCard index={1} delay={0.35}>
              <TransactionFeed transactions={data.recent_transactions.slice(0, 10)} />
            </AnimatedCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatedCard index={0} delay={0.5}>
              <SubscriptionGrid subscriptions={data.subscriptions} />
            </AnimatedCard>
            <AnimatedCard index={1} delay={0.5}>
              <UpcomingBills bills={data.upcoming_bills} />
            </AnimatedCard>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
