"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Camera,
  BrainCircuit,
  Receipt,
  Target,
  LogOut,
  Bell,
  Search,
  UserCircle,
  ChevronUp,
} from "lucide-react";
import { getUserId, getToken, clearAuth, fetchDashboard } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/cards", label: "Cards", icon: CreditCard },
  { href: "/dashboard/analyzer", label: "Purchase Analyzer", icon: Camera },
  { href: "/dashboard/goals", label: "Goals", icon: Target },
  { href: "/dashboard/advisor", label: "AI Advisor", icon: BrainCircuit },
  { href: "/dashboard/bills", label: "Bills & Subs", icon: Receipt },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; avatar_url: string | null } | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [dateLabel, setDateLabel] = useState<{ full: string; day: string } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const now = new Date();
    setDateLabel({
      full: now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      day: now.toLocaleDateString("en-US", { weekday: "long" }),
    });
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const uid = getUserId();
    const token = getToken();
    if (!uid || !token) {
      window.location.href = "/auth";
      return;
    }
    fetchDashboard(uid).then((d) => {
      const u = d.user as { name?: string; email?: string; avatar_url?: string | null; onboarding_complete?: boolean };
      if (u.onboarding_complete !== true) {
        window.location.href = "/onboarding";
        return;
      }
      setUser({
        name: u.name || "User",
        email: u.email || "",
        avatar_url: u.avatar_url || null,
      });
      setAlertCount(d.pending_alerts.length + d.notifications.length);
    }).catch((err: unknown) => {
      // If user not found (stale localStorage after a reseed), clear auth and redirect
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("404") || msg.includes("401")) {
        clearAuth();
        window.location.href = "/auth";
      }
    });
  }, []);

  const handleSignOut = () => {
    clearAuth();
    window.location.href = "/auth";
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" suppressHydrationWarning>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-6 pb-4" suppressHydrationWarning>
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/logo-icon.svg" alt="Vera Fund" className="w-8 h-8 rounded-full" />
            <span className="text-lg font-bold text-foreground">
              Vera<span className="text-muted-foreground font-medium">Fund</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border relative" suppressHydrationWarning ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-all"
            suppressHydrationWarning
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm" suppressHydrationWarning>
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0 text-left" suppressHydrationWarning>
              <p className="text-sm font-medium text-foreground truncate" suppressHydrationWarning>{user?.name || "Loading..."}</p>
              <p className="text-xs text-muted-foreground truncate" suppressHydrationWarning>{user?.email || ""}</p>
            </div>
            <ChevronUp
              size={14}
              className={`text-muted-foreground transition-transform ${userMenuOpen ? "rotate-0" : "rotate-180"}`}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-[72px] left-4 right-4 rounded-xl border border-border bg-card shadow-lg p-2 z-20">
              <Link
                href="/dashboard/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
              >
                <UserCircle size={16} />
                Profile & Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden" suppressHydrationWarning>
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
          <div className="relative w-72" suppressHydrationWarning>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions, cards..."
              className="w-full rounded-xl bg-background border border-border pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-4" suppressHydrationWarning>
            <button className="relative w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={16} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>
            <div className="text-right" suppressHydrationWarning>
              <p className="text-sm font-medium text-foreground" suppressHydrationWarning>
                {dateLabel?.full ?? ""}
              </p>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {dateLabel?.day ?? ""}
              </p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
