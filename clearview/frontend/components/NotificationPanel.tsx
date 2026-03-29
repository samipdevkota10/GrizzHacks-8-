"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  CheckCheck,
  X,
} from "lucide-react";
import {
  type AppNotification,
  getUserId,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  price_creep: { icon: TrendingUp, color: "text-primary/70" },
  fraud_denied: { icon: ShieldAlert, color: "text-primary" },
  fraud_alert: { icon: AlertTriangle, color: "text-primary" },
  card_paused: { icon: CreditCard, color: "text-muted-foreground" },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function routeForNotification(n: AppNotification): string | null {
  if (n.action_url) return n.action_url;
  switch (n.related_entity_type) {
    case "virtual_card":
      return "/dashboard/cards";
    case "subscription":
      return "/dashboard/bills";
    case "fraud_alert":
      return "/dashboard";
    default:
      return null;
  }
}

export function NotificationPanel({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: AppNotification[];
  initialUnreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialNotifications.filter((n) => !n.is_read).length);
  }, [initialNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const refresh = async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const data = await fetchNotifications(uid);
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter((n) => !n.is_read).length);
    } catch { /* silent */ }
  };

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) refresh();
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await markAllNotificationsRead(uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleClick = (n: AppNotification) => {
    if (!n.is_read) handleMarkRead(n._id);
    const route = routeForNotification(n);
    if (route) {
      setOpen(false);
      router.push(route);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 max-h-[480px] rounded-2xl border border-border bg-card shadow-xl z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 size={32} className="mb-2 opacity-40" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs mt-1">No notifications right now.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] || { icon: Bell, color: "text-muted-foreground" };
                const Icon = cfg.icon;
                return (
                  <button
                    key={n._id}
                    onClick={() => handleClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b border-border/50 last:border-0 ${
                      !n.is_read ? "bg-primary/[0.03]" : ""
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${cfg.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${!n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
