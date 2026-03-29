"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Info, AlertCircle, ChevronDown } from "lucide-react";
import type { ActionItem } from "@/lib/api";

const SEVERITY_STYLES = {
  high: "bg-warm border-primary/20 text-foreground dark:bg-warm dark:border-primary/30",
  medium: "bg-secondary/60 border-border text-foreground",
  low: "bg-secondary/40 border-border/60 text-foreground",
} as const;

const SEVERITY_ICON = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
} as const;

// Sort by severity: high first, then medium, then low
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

export function ActionCenterCard({
  actions,
  onActionClick,
}: {
  actions: ActionItem[];
  onActionClick?: (action: ActionItem) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  if (actions.length === 0) return null;

  const sorted = [...actions].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  // Always show the top 1 (most urgent). Expand to show all.
  const visible = expanded ? sorted : sorted.slice(0, 1);
  const hiddenCount = sorted.length - 1;

  const ActionRow = ({ action }: { action: ActionItem }) => {
    const Icon = SEVERITY_ICON[action.severity];
    return (
      <button
        key={action.id}
        onClick={() => {
          onActionClick?.(action);
          router.push(action.cta_route);
        }}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-sm ${SEVERITY_STYLES[action.severity]}`}
      >
        <Icon size={15} className="flex-shrink-0 opacity-70" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{action.title}</p>
          <p className="text-xs opacity-70 truncate">{action.description}</p>
        </div>
        <span className="text-xs font-medium whitespace-nowrap flex items-center gap-1 opacity-60">
          {action.cta_label} <ArrowRight size={11} />
        </span>
      </button>
    );
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <AlertCircle size={14} className="text-primary" />
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Action Center</h3>
        {hiddenCount > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? "Show less" : `+${hiddenCount} more`}
            <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {visible.map((action) => <ActionRow key={action.id} action={action} />)}
      </div>
    </div>
  );
}
