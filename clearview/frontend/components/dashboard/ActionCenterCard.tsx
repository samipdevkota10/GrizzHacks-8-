"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Info, AlertCircle } from "lucide-react";
import type { ActionItem } from "@/lib/api";

const SEVERITY_STYLES = {
  high: "bg-warm border-primary/20 text-foreground dark:bg-warm dark:border-primary/30",
  medium: "bg-secondary border-border text-foreground",
  low: "bg-secondary border-border text-foreground",
} as const;

const SEVERITY_ICON = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
} as const;

export function ActionCenterCard({
  actions,
  onActionClick,
}: {
  actions: ActionItem[];
  onActionClick?: (action: ActionItem) => void;
}) {
  const router = useRouter();

  if (actions.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <AlertCircle size={16} className="text-primary" />
        Action Center
        <span className="ml-auto text-xs font-normal text-muted-foreground">{actions.length} item{actions.length > 1 ? "s" : ""}</span>
      </h3>
      <div className="space-y-2">
        {actions.map((action) => {
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
              <Icon size={16} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{action.title}</p>
                <p className="text-xs opacity-80 truncate">{action.description}</p>
              </div>
              <span className="text-xs font-medium whitespace-nowrap flex items-center gap-1">
                {action.cta_label} <ArrowRight size={12} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
