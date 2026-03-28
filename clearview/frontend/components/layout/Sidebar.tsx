"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  Phone,
} from "lucide-react";
import { VoiceCallModal } from "@/components/vera/VoiceCallModal";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cards", label: "Virtual Cards", icon: CreditCard },
  { href: "/advisor", label: "AI Advisor", icon: MessageSquare },
] as const;

function GemIcon() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 text-accent-blue"
      aria-hidden
    >
      <path
        d="M12 2L20 8.5L12 22L4 8.5L12 2Z"
        fill="currentColor"
        fillOpacity={0.95}
      />
      <path
        d="M12 2L8 8.5H16L12 2Z"
        fill="currentColor"
        fillOpacity={0.5}
      />
    </svg>
  );
}

const DEMO_USER_ID = typeof window !== "undefined"
  ? localStorage.getItem("clearview_user_id") || "DEMO"
  : "DEMO";

export function Sidebar() {
  const pathname = usePathname();
  const [showVoiceCall, setShowVoiceCall] = useState(false);

  return (
    <>
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border-subtle bg-bg-secondary">
      <div className="flex items-center gap-2.5 border-b border-border-subtle px-5 py-5">
        <GemIcon />
        <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-text-primary">
          Clearview
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Main">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                active
                  ? "border-l-[3px] border-accent-blue bg-bg-tertiary pl-[calc(0.75rem-3px)] text-text-primary"
                  : "border-l-[3px] border-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
              }`}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 border-t border-border-subtle px-4 py-5">
        <button
          type="button"
          onClick={() => setShowVoiceCall(true)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-vera-primary/40 bg-vera-primary/20 px-4 py-2.5 text-sm font-semibold text-vera-primary transition-colors duration-200 hover:bg-vera-primary/30 animate-vera-pulse"
        >
          <Phone className="size-[18px] shrink-0" strokeWidth={2} />
          Call Vera
        </button>

        <div className="flex cursor-default items-center gap-3 rounded-lg px-1 py-1">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-xs font-semibold text-accent-blue"
            aria-hidden
          >
            AC
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              Alex Chen
            </p>
            <p className="truncate text-xs text-text-secondary">
              alex@clearviewdemo.com
            </p>
          </div>
        </div>
      </div>
    </aside>
    <VoiceCallModal
      isOpen={showVoiceCall}
      onClose={() => setShowVoiceCall(false)}
      userId={DEMO_USER_ID}
    />
    </>
  );
}
