"use client";

export type SubscriptionItem = {
  _id: string;
  name: string;
  amount: number;
  next_billing_date: string;
  status: string;
  usage_score: number | null;
  ai_cancel_recommendation: boolean;
  category: string;
};

export type SubscriptionGridProps = {
  subscriptions: SubscriptionItem[];
};

function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function formatRenewalDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function categoryCircleClass(category: string): string {
  const key = category.toLowerCase();
  const map: Record<string, string> = {
    food: "bg-positive/20 text-positive",
    transport: "bg-accent-blue/20 text-accent-blue",
    entertainment: "bg-vera-primary/20 text-vera-primary",
    shopping: "bg-warning/20 text-warning",
    health: "bg-accent-blue-dim/20 text-accent-blue",
    utilities: "bg-neutral/20 text-neutral",
    subscription: "bg-accent-blue/20 text-accent-blue",
    streaming: "bg-vera-secondary/20 text-vera-secondary",
  };
  return map[key] ?? "bg-bg-tertiary text-text-secondary";
}

function statusDotClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "active") return "bg-positive";
  if (s === "paused") return "bg-warning";
  return "bg-neutral";
}

export function SubscriptionGrid({ subscriptions }: SubscriptionGridProps) {
  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary">
          Active Subscriptions
        </h2>
        <p className="text-sm text-text-secondary">
          {formatCurrency(totalMonthly)}/month
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {subscriptions.map((sub) => {
          const initial = sub.name.trim().charAt(0).toUpperCase() || "?";
          const circle = categoryCircleClass(sub.category);

          return (
            <div
              key={sub._id}
              className="cursor-pointer rounded-xl border border-border-subtle bg-bg-tertiary/50 p-4 transition-all duration-200 hover:border-border-emphasis"
            >
              <div className="mb-2 flex items-start gap-2">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${circle}`}
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-text-primary">
                      {sub.name}
                    </span>
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${statusDotClass(sub.status)}`}
                      title={sub.status}
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
              <p className="mb-1 font-[family-name:var(--font-display)] text-lg font-bold text-text-primary">
                {formatCurrency(sub.amount)}
              </p>
              <p className="text-xs text-text-secondary">
                Renews {formatRenewalDate(sub.next_billing_date)}
              </p>
              {sub.ai_cancel_recommendation && (
                <span className="mt-2 inline-block rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
                  Consider cancelling
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
