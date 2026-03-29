"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const now = new Date();
    setDateLabel({
      full: now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      day: now.toLocaleDateString("en-US", { weekday: "long" }),
    });
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
      if (u.onboarding_complete === false) {
        window.location.href = "/onboarding";
        return;
      }
      setUser({
        name: u.name || "User",
        email: u.email || "",
        avatar_url: u.avatar_url || null,
      });
      setAlertCount(d.pending_alerts.length + d.notifications.length);
    }).catch(() => {});
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

        <div className="p-4 border-t border-border" suppressHydrationWarning>
          <div className="flex items-center gap-3 px-2 mb-3" suppressHydrationWarning>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm" suppressHydrationWarning>
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0" suppressHydrationWarning>
              <p className="text-sm font-medium text-foreground truncate" suppressHydrationWarning>{user?.name || "Loading..."}</p>
              <p className="text-xs text-muted-foreground truncate" suppressHydrationWarning>{user?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all w-full"
          >
            <LogOut size={16} />
            Sign out
          </button>
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
