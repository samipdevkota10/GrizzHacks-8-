"use client";

import { useEffect, useState } from "react";
import { Calendar, Repeat, CreditCard, X, AlertTriangle, CheckCircle2, ShieldCheck, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { MerchantLogo } from "@/components/MerchantLogo";
import {
  getUserId,
  clearAuth,
  fetchDashboard,
  type Subscription,
  type UpcomingBill,
} from "@/lib/api";

// ── Cancel confirmation modal ────────────────────────────────────────────────
function CancelModal({
  sub,
  onConfirm,
  onClose,
}: {
  sub: Subscription;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle size={18} className="text-destructive" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Cancel Subscription</p>
              <p className="text-xs text-muted-foreground">{sub.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-1">
          You're about to cancel <span className="font-medium text-foreground">{sub.name}</span>. This will stop future charges of{" "}
          <span className="font-medium text-foreground">${sub.amount.toFixed(2)}/{sub.billing_cycle === "monthly" ? "mo" : sub.billing_cycle}</span>.
        </p>
        {sub.ai_cancel_recommendation && (
          <div className="mt-3 flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
            <Zap size={14} className="text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-primary">ClearView AI recommends cancelling — low usage detected.</p>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors"
          >
            Yes, cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Isolate-to-card modal ────────────────────────────────────────────────────
function IsolateModal({
  sub,
  onConfirm,
  onClose,
}: {
  sub: Subscription;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Isolate to Virtual Card</p>
              <p className="text-xs text-muted-foreground">{sub.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          A dedicated virtual card will be created for <span className="font-medium text-foreground">{sub.name}</span>. Only this subscription can charge it — keeping your real card protected.
        </p>

        <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 space-y-1.5 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Card limit</span>
            <span className="font-medium text-foreground">${(sub.amount * 1.1).toFixed(2)}/cycle</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Merchant lock</span>
            <span className="font-medium text-foreground">{sub.name} only</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Auto-pause on overage</span>
            <span className="font-medium text-green-600">Enabled</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Not now
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Create card
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-foreground text-background text-sm font-medium px-4 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
      <CheckCircle2 size={16} className="text-green-400 shrink-0" />
      {message}
    </div>
  );
}

// ── Subscription row ─────────────────────────────────────────────────────────
function SubscriptionRow({
  sub,
  cancelled,
  isolated,
  onCancel,
  onIsolate,
}: {
  sub: Subscription;
  cancelled: boolean;
  isolated: boolean;
  onCancel: () => void;
  onIsolate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const nextDate = new Date(sub.next_billing_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className={`rounded-xl border transition-all ${cancelled ? "border-border opacity-50" : "border-border hover:border-border/80"}`}>
      <div
        className="flex items-center justify-between px-4 py-3.5 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <MerchantLogo domain={sub.logo_url} name={sub.name} size={32} />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{sub.name}</p>
              {cancelled && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Cancelled</span>
              )}
              {isolated && !cancelled && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Virtual card</span>
              )}
              {sub.ai_cancel_recommendation && !cancelled && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 flex items-center gap-1">
                  <Zap size={9} /> Low usage
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{sub.category} · renews {nextDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground tabular-nums">${sub.amount.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">{sub.billing_cycle}</p>
          </div>
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 flex gap-2">
          <button
            disabled={cancelled}
            onClick={(e) => { e.stopPropagation(); onIsolate(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CreditCard size={13} />
            {isolated ? "Re-assign card" : "Isolate to card"}
          </button>
          <button
            disabled={cancelled}
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X size={13} />
            Cancel subscription
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function BillsPage() {
  const [bills, setBills] = useState<UpcomingBill[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [isolateTarget, setIsolateTarget] = useState<Subscription | null>(null);
  const [cancelled, setCancelled] = useState<Set<string>>(new Set());
  const [isolated, setIsolated] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) { setLoading(false); return; }
    fetchDashboard(uid)
      .then((d) => {
        setBills(d.upcoming_bills);
        setSubscriptions(
          (d.subscriptions as unknown as Subscription[]).filter((s) => s.status === "active"),
        );
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("404") || msg.includes("401")) { clearAuth(); window.location.href = "/auth"; }
      })
      .finally(() => setLoading(false));
  }, []);

  function handleConfirmCancel() {
    if (!cancelTarget) return;
    setCancelled((prev) => new Set(prev).add(cancelTarget._id));
    setToast(`${cancelTarget.name} has been cancelled`);
    setCancelTarget(null);
  }

  function handleConfirmIsolate() {
    if (!isolateTarget) return;
    setIsolated((prev) => new Set(prev).add(isolateTarget._id));
    setToast(`Virtual card created for ${isolateTarget.name}`);
    setIsolateTarget(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter((s) => !cancelled.has(s._id));
  const cancelledSubscriptions = subscriptions.filter((s) => cancelled.has(s._id));
  const totalMonthlyBills = bills.reduce((s, b) => s + b.amount, 0);
  const totalSubscriptions = activeSubscriptions.reduce((s, sub) => s + sub.amount, 0);
  const aiRecommended = activeSubscriptions.filter((s) => s.ai_cancel_recommendation);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bills & Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">Track recurring payments and manage your subscriptions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-xs text-muted-foreground mb-1">Upcoming Bills</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">${totalMonthlyBills.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-xs text-muted-foreground mb-1">Active Subscriptions</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">${totalSubscriptions.toFixed(2)}/mo</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-xs text-muted-foreground mb-1">Total Recurring</p>
          <p className="text-2xl font-bold text-primary tabular-nums">${(totalMonthlyBills + totalSubscriptions).toFixed(2)}/mo</p>
        </div>
      </div>

      {/* AI cancel recommendations banner */}
      {aiRecommended.length > 0 && (
        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 flex items-start gap-3">
          <Zap size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              ClearView spotted {aiRecommended.length} low-usage subscription{aiRecommended.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {aiRecommended.map((s) => s.name).join(", ")} · expand to review and cancel
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Upcoming bills */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            Upcoming Bills
          </h2>
          <div className="space-y-1">
            {bills.length > 0 ? bills.map((bill) => (
              <div key={bill.name} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{bill.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {new Date(bill.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <p className="text-sm font-medium text-foreground tabular-nums">${bill.amount.toFixed(2)}</p>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-2">No upcoming bills detected</p>
                <a href="/onboarding" className="text-xs text-primary hover:underline">Connect accounts in onboarding →</a>
              </div>
            )}
          </div>
        </div>

        {/* Subscriptions */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Repeat size={16} className="text-primary" />
            Active Subscriptions
            {activeSubscriptions.length > 0 && (
              <span className="ml-auto text-[10px] text-muted-foreground font-normal">tap to manage</span>
            )}
          </h2>

          {subscriptions.length > 0 ? (
            <div className="space-y-2">
              {activeSubscriptions.map((sub) => (
                <SubscriptionRow
                  key={sub._id}
                  sub={sub}
                  cancelled={false}
                  isolated={isolated.has(sub._id)}
                  onCancel={() => setCancelTarget(sub)}
                  onIsolate={() => setIsolateTarget(sub)}
                />
              ))}
              {cancelledSubscriptions.length > 0 && (
                <>
                  <p className="text-[10px] text-muted-foreground pt-2 pb-1 px-1">Cancelled this session</p>
                  {cancelledSubscriptions.map((sub) => (
                    <SubscriptionRow
                      key={sub._id}
                      sub={sub}
                      cancelled={true}
                      isolated={false}
                      onCancel={() => {}}
                      onIsolate={() => {}}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">No active subscriptions</p>
              <a href="/onboarding" className="text-xs text-primary hover:underline">Connect accounts to detect subscriptions →</a>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {cancelTarget && (
        <CancelModal
          sub={cancelTarget}
          onConfirm={handleConfirmCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
      {isolateTarget && (
        <IsolateModal
          sub={isolateTarget}
          onConfirm={handleConfirmIsolate}
          onClose={() => setIsolateTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
