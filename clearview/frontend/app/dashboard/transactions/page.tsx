"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { TRANSACTIONS } from "@/lib/mock-data";
import { MerchantLogo } from "@/components/MerchantLogo";

const CATEGORIES = ["All", "Income", "Food & Dining", "Shopping", "Transportation", "Subscriptions", "Health"];

export default function TransactionsPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = TRANSACTIONS.filter((tx) => {
    if (filter !== "All" && tx.category !== filter) return false;
    if (search && !tx.merchant.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">All your recent financial activity</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-card border border-border pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-border">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === cat
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-5 py-3">Transaction</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-5 py-3">Category</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-5 py-3">Date</th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-5 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <MerchantLogo domain={tx.logo} name={tx.merchant} size={28} />
                    <span className="text-sm font-medium text-foreground">{tx.merchant}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {tx.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{tx.date}</td>
                <td className={`px-5 py-3.5 text-right text-sm font-medium tabular-nums ${tx.amount > 0 ? "text-green-600" : "text-foreground"}`}>
                  {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
