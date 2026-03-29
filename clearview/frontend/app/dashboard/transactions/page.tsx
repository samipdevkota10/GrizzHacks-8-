"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { getUserId, fetchTransactions, type Transaction } from "@/lib/api";
import { MerchantLogo } from "@/components/MerchantLogo";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const uid = getUserId();
    if (!uid) { setLoading(false); return; }
    fetchTransactions(uid)
      .then((res) => setTransactions(res.transactions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(transactions.map((tx) => tx.category)))];

  const filtered = transactions.filter((tx) => {
    if (filter !== "All" && tx.category !== filter) return false;
    if (search && !tx.merchant_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">All your recent financial activity</p>
      </div>

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
        <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-border overflow-x-auto">
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                filter === cat
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

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
              <tr key={tx._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <MerchantLogo domain={tx.merchant_logo_url} name={tx.merchant_name} size={28} />
                    <span className="text-sm font-medium text-foreground">{tx.merchant_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {tx.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">
                  {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
                <td className={`px-5 py-3.5 text-right text-sm font-medium tabular-nums ${tx.amount > 0 ? "text-green-600" : "text-foreground"}`}>
                  {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">No transactions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
