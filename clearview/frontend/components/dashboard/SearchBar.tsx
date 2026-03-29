"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, ArrowLeftRight, Receipt, CreditCard, X } from "lucide-react";
import { getUserId, searchDashboard, type SearchResult } from "@/lib/api";

const TYPE_ICONS: Record<string, React.ElementType> = {
  transaction: ArrowLeftRight,
  subscription: Receipt,
  card: CreditCard,
};

const TYPE_LABELS: Record<string, string> = {
  transaction: "Transactions",
  subscription: "Subscriptions",
  card: "Cards",
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((q: string) => {
    const uid = getUserId();
    if (!uid || !q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    searchDashboard(uid, q)
      .then((res) => {
        setResults(res.results);
        setOpen(true);
        setSelectedIdx(-1);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navigate = (route: string) => {
    setOpen(false);
    setQuery("");
    window.location.href = route;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      navigate(results[selectedIdx].route);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="relative w-72" ref={wrapperRef}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder="Search transactions, cards..."
        className="w-full rounded-xl bg-background border border-border pl-9 pr-8 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
      {query && (
        <button
          onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
      )}

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 rounded-xl border border-border bg-card shadow-xl z-50 max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-xs text-muted-foreground">Searching...</div>
          )}
          {Object.entries(grouped).map(([type, items]) => {
            const Icon = TYPE_ICONS[type] || Search;
            return (
              <div key={type}>
                <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 flex items-center gap-1.5">
                  <Icon size={12} />
                  {TYPE_LABELS[type] || type}
                </div>
                {items.map((item, i) => {
                  const globalIdx = results.indexOf(item);
                  return (
                    <button
                      key={item._id}
                      onClick={() => navigate(item.route)}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors ${
                        globalIdx === selectedIdx ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                      </div>
                      {item.date && (
                        <span className="text-[10px] text-muted-foreground ml-3 flex-shrink-0">
                          {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {!loading && results.length === 0 && query.trim() && (
            <div className="px-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">No results found</p>
              <p className="text-xs text-muted-foreground mt-1">Try: &quot;starbucks&quot;, &quot;food this month&quot;, &quot;over $50&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
