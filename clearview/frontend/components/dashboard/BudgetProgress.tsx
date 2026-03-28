"use client";

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food & Dining",
  transport: "Transport",
  entertainment: "Entertainment",
  shopping: "Shopping",
  health: "Health",
  utilities: "Utilities",
  subscription: "Subscriptions",
  other: "Other",
};

export type BudgetProgressProps = {
  spent: number;
  budget: number;
  byCategory: Record<string, number>;
  categoryBudgets: Record<string, number>;
};

function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function labelForCategory(key: string): string {
  return CATEGORY_LABELS[key] ?? key.replace(/_/g, " ");
}

export function BudgetProgress({
  spent,
  budget,
  byCategory,
  categoryBudgets,
}: BudgetProgressProps) {
  const safeBudget = budget > 0 ? budget : 0;
  const remaining = Math.max(0, safeBudget - spent);
  const remainingRatio = safeBudget > 0 ? remaining / safeBudget : 0;

  let remainingClass = "text-negative";
  if (remainingRatio > 0.2) remainingClass = "text-positive";
  else if (remainingRatio >= 0.1) remainingClass = "text-warning";

  const spentPct =
    safeBudget > 0 ? Math.min(100, (spent / safeBudget) * 100) : 0;

  let barColorClass = "bg-negative";
  if (remainingRatio > 0.5) barColorClass = "bg-positive";
  else if (remainingRatio >= 0.2) barColorClass = "bg-warning";

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-text-primary">Budget</h2>
        <p className={`text-sm font-medium ${remainingClass}`}>
          {formatCurrency(remaining)} remaining
        </p>
      </div>
      <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-bg-tertiary">
        <div
          className={`h-full rounded-full transition-all ${barColorClass}`}
          style={{ width: `${spentPct}%` }}
        />
      </div>
      <div className="space-y-4">
        {topCategories.map(([key, catSpent]) => {
          const catBudget = categoryBudgets[key] ?? 0;
          const catPct =
            catBudget > 0
              ? Math.min(100, (catSpent / catBudget) * 100)
              : catSpent > 0
                ? 100
                : 0;

          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="text-text-primary">
                  {labelForCategory(key)}{" "}
                  <span className="text-text-secondary">
                    {formatCurrency(catSpent)}
                  </span>
                </span>
                <span className="shrink-0 text-text-secondary">
                  {formatCurrency(catBudget)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary">
                <div
                  className="h-full rounded-full bg-accent-blue"
                  style={{ width: `${catPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
