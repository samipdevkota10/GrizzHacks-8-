"use client";

import { Bell, Search } from "lucide-react";

type TopBarProps = {
  title: string;
  alertCount?: number;
};

export function TopBar({ title, alertCount = 0 }: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-6">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-text-primary">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative flex cursor-pointer items-center justify-center rounded-lg p-2 text-text-secondary transition-colors duration-200 hover:bg-bg-tertiary hover:text-text-primary"
          aria-label={`Notifications${alertCount > 0 ? `, ${alertCount} unread` : ""}`}
        >
          <Bell className="size-5" strokeWidth={2} />
          {alertCount > 0 ? (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-negative text-[10px] font-bold leading-none text-white">
              {alertCount > 99 ? "99+" : alertCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          className="flex cursor-pointer items-center justify-center rounded-lg p-2 text-text-secondary transition-colors duration-200 hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Search"
        >
          <Search className="size-5" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
