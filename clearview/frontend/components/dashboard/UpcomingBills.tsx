"use client";

export type UpcomingBill = {
  name: string;
  amount: number;
  date: string;
  logo_url: string | null;
};

export type UpcomingBillsProps = {
  bills: UpcomingBill[];
};

function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function formatBillDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function UpcomingBills({ bills }: UpcomingBillsProps) {
  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary">
          Upcoming Bills
        </h2>
        <p className="text-sm text-text-secondary">Next 30 days</p>
      </div>
      <div
        className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {bills.map((bill, index) => (
          <div
            key={`${bill.name}-${bill.date}-${index}`}
            role="listitem"
            className="flex min-w-[140px] flex-shrink-0 flex-col rounded-xl border border-border-subtle bg-bg-tertiary/50 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              {bill.logo_url ? (
                <img
                  src={bill.logo_url}
                  alt=""
                  className="size-8 rounded-lg object-cover"
                />
              ) : null}
              <p className="text-sm font-medium text-text-primary">{bill.name}</p>
            </div>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary">
              {formatCurrency(bill.amount)}
            </p>
            <p className="text-xs text-text-secondary">{formatBillDate(bill.date)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
