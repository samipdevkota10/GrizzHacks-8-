"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  Phone,
  LogOut,
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

type SidebarProps = { userId: string | null };

export function Sidebar({ userId }: SidebarProps) {
  const pathname = usePathname();
  const [showVoiceCall, setShowVoiceCall] = useState(false);

  return (
    <>
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border-subtle bg-bg-secondary/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="flex items-center gap-2.5 border-b border-border-subtle px-5 py-5"
      >
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <GemIcon />
        </motion.div>
        <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-text-primary">
          Clearview
        </span>
      </motion.div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Main">
        {navItems.map(({ href, label, icon: Icon }, index) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.1 + index * 0.06,
                ease: [0.21, 0.47, 0.32, 0.98] as const,
              }}
            >
              <Link
                href={href}
                className={`relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "text-text-primary"
                    : "text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-bg-tertiary"
                    style={{ zIndex: -1 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
                {active && (
                  <motion.div
                    layoutId="sidebar-accent"
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent-blue"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
                <Icon className="size-[18px] shrink-0" strokeWidth={2} />
                {label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 border-t border-border-subtle px-4 py-5">
        <motion.button
          type="button"
          disabled={!userId}
          title={!userId ? "Set clearview_user_id in localStorage (see dashboard hint)" : undefined}
          onClick={() => userId && setShowVoiceCall(true)}
          whileHover={userId ? { scale: 1.03, y: -1 } : undefined}
          whileTap={userId ? { scale: 0.97 } : undefined}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-vera-primary/40 bg-vera-primary/20 px-4 py-2.5 text-sm font-semibold text-vera-primary transition-colors duration-200 hover:bg-vera-primary/30 animate-vera-pulse disabled:pointer-events-none disabled:opacity-40"
        >
          <Phone className="size-[18px] shrink-0" strokeWidth={2} />
          Call Vera
        </motion.button>

        <div className="flex cursor-default items-center gap-3 rounded-lg px-1 py-1">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue/30 to-vera-primary/30 text-xs font-semibold text-accent-blue ring-1 ring-white/[0.06]"
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
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => { window.location.href = "/auth"; }}
            className="rounded-lg p-1.5 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary/50 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </motion.button>
        </div>
      </div>
    </aside>
    <VoiceCallModal
      isOpen={showVoiceCall && Boolean(userId)}
      onClose={() => setShowVoiceCall(false)}
      userId={userId ?? ""}
    />
    </>
  );
}
