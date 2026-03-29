"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Camera,
  Upload,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  X,
  Receipt,
  Bookmark,
  BookmarkCheck,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Ban,
  Lightbulb,
  Target,
  CalendarClock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";

import { getUserId } from "@/lib/api";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

type GoalDelay = { goal_name: string; delayed_by_weeks: number };
type Alternative = { name: string; estimated_price: number };

type AnalysisResult = {
  analysis_id?: string;
  product: string;
  price: number;
  currency: string;
  verdict: string;
  reasoning: string;
  hours_of_work: number;
  days_of_work: number;
  budget_impact_percent: number;
  category_context: string;
  goal_delays: GoalDelay[];
  alternatives: Alternative[];
  total_cost_note: string | null;
  thirty_day_suggestion: boolean;
};

type ReceiptItem = {
  name: string;
  price: number;
  quantity: number;
  category: string;
};

type ReceiptResult = {
  scan_id?: string;
  merchant: string;
  date: string | null;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string | null;
};

type HistoryItem = {
  _id: string;
  product: string;
  price: number;
  verdict: string;
  created_at: string;
};

type WishlistItem = {
  _id: string;
  product: string;
  price: number;
  verdict: string;
  created_at: string;
};

const VERDICT_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; bg: string; text: string; border: string }> = {
  GO_FOR_IT: { label: "Go For It!", icon: ShieldCheck, bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  THINK_TWICE: { label: "Think Twice", icon: Lightbulb, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  HOLD_OFF: { label: "Hold Off", icon: ShieldAlert, bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  HARD_NO: { label: "Hard No", icon: Ban, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

function VerdictBadge({ verdict }: { verdict: string }) {
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.THINK_TWICE;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${config.bg} ${config.text} border ${config.border}`}>
      <Icon size={16} />
      {config.label}
    </span>
  );
}

export default function PurchaseAnalyzer() {
  const [mode, setMode] = useState<"purchase" | "receipt">("purchase");
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [purchaseResult, setPurchaseResult] = useState<AnalysisResult | null>(null);
  const [receiptResult, setReceiptResult] = useState<ReceiptResult | null>(null);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [receiptConfirmed, setReceiptConfirmed] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [savedToWishlist, setSavedToWishlist] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [userStats, setUserStats] = useState({ netHourlyRate: 0, budgetRemaining: 0, monthlySavings: 0 });

  const uid = typeof window !== "undefined" ? getUserId() : "";

  useEffect(() => {
    if (!uid) return;
    fetch(`${API_URL}/api/dashboard/${uid}`)
      .then((r) => r.json())
      .then((data) => {
        const profile = data.financial_profile;
        if (profile) {
          const hr = profile.hourly_rate || profile.monthly_income / 160;
          const tax = profile.tax_rate || 0.22;
          setUserStats({
            netHourlyRate: hr * (1 - tax),
            budgetRemaining: data.monthly_summary?.remaining || 0,
            monthlySavings: (profile.monthly_income || 0) - (data.monthly_summary?.spent || 0),
          });
        }
      })
      .catch(() => {});

    loadHistory();
    loadWishlist();
  }, []);

  function loadHistory() {
    fetch(`${API_URL}/api/advisor/purchase-history/${uid}?limit=10`)
      .then((r) => r.json())
      .then((data) => setHistory(data.analyses || []))
      .catch(() => {});
  }

  function loadWishlist() {
    fetch(`${API_URL}/api/advisor/wishlist/${uid}`)
      .then((r) => r.json())
      .then((data) => setWishlist(data.items || []))
      .catch(() => {});
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
  });

  const analyzePurchase = async () => {
    if (!imageFile || !uid) return;
    setAnalyzing(true);
    setError(null);
    setSavedToWishlist(false);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("user_id", uid);
      const res = await fetch(`${API_URL}/api/advisor/purchase-check`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data: AnalysisResult = await res.json();
      setPurchaseResult(data);
      loadHistory();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed. Check that the backend is running.");
    } finally {
      setAnalyzing(false);
    }
  };

  const scanReceipt = async () => {
    if (!imageFile || !uid) return;
    setAnalyzing(true);
    setError(null);
    setReceiptConfirmed(false);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("user_id", uid);
      const res = await fetch(`${API_URL}/api/advisor/scan-receipt`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data: ReceiptResult = await res.json();
      setReceiptResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Receipt scan failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const confirmReceipt = async () => {
    if (!receiptResult?.scan_id) return;
    setConfirmingReceipt(true);
    try {
      const res = await fetch(`${API_URL}/api/advisor/scan-receipt/${receiptResult.scan_id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to confirm receipt");
      setReceiptConfirmed(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save receipt as transaction.");
    } finally {
      setConfirmingReceipt(false);
    }
  };

  const saveToWishlist = async () => {
    if (!purchaseResult || !uid) return;
    try {
      await fetch(`${API_URL}/api/advisor/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: uid,
          product: purchaseResult.product,
          price: purchaseResult.price,
          verdict: purchaseResult.verdict,
          reasoning: purchaseResult.reasoning,
          analysis_id: purchaseResult.analysis_id,
        }),
      });
      setSavedToWishlist(true);
      loadWishlist();
    } catch {
      /* silent */
    }
  };

  const removeFromWishlist = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/advisor/wishlist/${id}`, { method: "DELETE" });
      setWishlist((prev) => prev.filter((w) => w._id !== id));
    } catch {
      /* silent */
    }
  };

  const reset = () => {
    setImage(null);
    setImageFile(null);
    setPurchaseResult(null);
    setReceiptResult(null);
    setError(null);
    setSavedToWishlist(false);
    setReceiptConfirmed(false);
  };

  const hasResult = mode === "purchase" ? !!purchaseResult : !!receiptResult;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Analyzer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered purchase decisions and receipt scanning — backed by your real financial data.
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => { setMode("purchase"); reset(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "purchase" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Camera size={16} /> Can I Afford This?
        </button>
        <button
          onClick={() => { setMode("receipt"); reset(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "receipt" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Receipt size={16} /> Scan Receipt
        </button>
      </div>

      {/* Stats Bar */}
      {mode === "purchase" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Your Hourly Rate (After Tax)</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              ${userStats.netHourlyRate > 0 ? userStats.netHourlyRate.toFixed(2) : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Remaining Monthly Budget</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              ${userStats.budgetRemaining > 0 ? userStats.budgetRemaining.toLocaleString() : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Monthly Savings</p>
            <p className="text-xl font-bold text-green-600 tabular-nums">
              ${userStats.monthlySavings > 0 ? userStats.monthlySavings.toLocaleString() : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Analysis Failed</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={16} /></button>
        </div>
      )}

      {!hasResult ? (
        /* Upload Area */
        <div className="rounded-2xl bg-card border border-border p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <input {...getInputProps()} />
            {image ? (
              <div className="space-y-4">
                <img src={image} alt="Upload preview" className="max-h-64 mx-auto rounded-xl object-contain" />
                <p className="text-sm text-muted-foreground">Click or drag to replace</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  {mode === "purchase" ? <Camera size={28} className="text-primary" /> : <Receipt size={28} className="text-primary" />}
                </div>
                <div>
                  <p className="text-base font-medium text-foreground">
                    {mode === "purchase"
                      ? "Upload a photo of what you want to buy"
                      : "Upload a photo of your receipt"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag & drop or click to browse. PNG, JPG, WEBP supported.
                  </p>
                </div>
              </div>
            )}
          </div>

          {image && (
            <div className="flex justify-center mt-6">
              <button
                onClick={mode === "purchase" ? analyzePurchase : scanReceipt}
                disabled={analyzing}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all disabled:opacity-60"
              >
                {analyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {mode === "purchase" ? "Analyzing with Gemini..." : "Scanning receipt..."}
                  </>
                ) : (
                  <>
                    {mode === "purchase" ? <Camera size={16} /> : <Receipt size={16} />}
                    {mode === "purchase" ? "Analyze Purchase" : "Scan Receipt"}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : mode === "purchase" && purchaseResult ? (
        /* Purchase Results */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Analysis Results</h2>
            <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <X size={14} /> New analysis
            </button>
          </div>

          {/* Product + Verdict */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-card border border-border p-4">
              {image && <img src={image} alt="Analyzed" className="rounded-xl w-full object-contain" />}
            </div>
            <div className="col-span-2 rounded-2xl bg-card border border-border p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{purchaseResult.product}</h3>
                  <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                    ${purchaseResult.price.toFixed(2)}
                  </p>
                </div>
                <VerdictBadge verdict={purchaseResult.verdict} />
              </div>

              {/* Hours of Work */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                <Clock size={20} className="text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">This purchase costs you</p>
                  <p className="text-2xl font-bold text-foreground">
                    {purchaseResult.hours_of_work} hours{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({purchaseResult.days_of_work} work days)
                    </span>
                  </p>
                </div>
              </div>

              {/* Budget Impact */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget impact</span>
                  <span className="font-medium text-foreground">{purchaseResult.budget_impact_percent}% of remaining</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      purchaseResult.budget_impact_percent > 60 ? "bg-red-500"
                        : purchaseResult.budget_impact_percent > 25 ? "bg-amber-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(purchaseResult.budget_impact_percent, 100)}%` }}
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{purchaseResult.reasoning}</p>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {purchaseResult.thirty_day_suggestion && !savedToWishlist && (
                  <button
                    onClick={saveToWishlist}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-all"
                  >
                    <Bookmark size={14} /> Save for Later
                  </button>
                )}
                {savedToWishlist && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-50 text-sm font-medium text-green-700">
                    <BookmarkCheck size={14} /> Saved to Wishlist
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Goal Delays */}
          {purchaseResult.goal_delays && purchaseResult.goal_delays.length > 0 && (
            <div className="rounded-2xl bg-card border border-border p-5">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Target size={16} className="text-primary" /> Impact on Your Goals
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {purchaseResult.goal_delays.map((g) => (
                  <div key={g.goal_name} className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground">{g.goal_name}</p>
                    <p className="text-sm font-bold text-foreground mt-1">
                      Delayed by {g.delayed_by_weeks} {g.delayed_by_weeks === 1 ? "week" : "weeks"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternatives */}
          {purchaseResult.alternatives && purchaseResult.alternatives.length > 0 && (
            <div className="rounded-2xl bg-card border border-border p-5">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500" /> Cheaper Alternatives
              </h3>
              <div className="space-y-2">
                {purchaseResult.alternatives.map((alt, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-foreground">{alt.name}</span>
                    <span className="text-sm font-bold text-green-600">~${alt.estimated_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Cost Note + 30-Day Rule */}
          {(purchaseResult.total_cost_note || purchaseResult.thirty_day_suggestion) && (
            <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
              {purchaseResult.total_cost_note && (
                <div className="flex items-start gap-3">
                  <DollarSign size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{purchaseResult.total_cost_note}</p>
                </div>
              )}
              {purchaseResult.thirty_day_suggestion && (
                <div className="flex items-start gap-3">
                  <CalendarClock size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700 font-medium">
                    Consider the 30-day rule: save this item and revisit in a month. If you still want it, you&apos;ll buy it with confidence.
                  </p>
                </div>
              )}
            </div>
          )}

          {purchaseResult.category_context && (
            <div className="rounded-2xl bg-card border border-border p-4">
              <p className="text-sm text-muted-foreground">{purchaseResult.category_context}</p>
            </div>
          )}
        </div>
      ) : mode === "receipt" && receiptResult ? (
        /* Receipt Results */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Receipt Scan Results</h2>
            <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <X size={14} /> Scan another
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-card border border-border p-4">
              {image && <img src={image} alt="Receipt" className="rounded-xl w-full object-contain" />}
            </div>
            <div className="col-span-2 space-y-4">
              <div className="rounded-2xl bg-card border border-border p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{receiptResult.merchant}</h3>
                    {receiptResult.date && <p className="text-sm text-muted-foreground">{receiptResult.date}</p>}
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">${receiptResult.total.toFixed(2)}</p>
                </div>

                {receiptResult.items.length > 0 && (
                  <div className="space-y-1.5">
                    {receiptResult.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{item.name}</span>
                          {item.quantity > 1 && (
                            <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.category}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground tabular-nums">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-border space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">${receiptResult.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="tabular-nums">${receiptResult.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span className="tabular-nums">${receiptResult.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {!receiptConfirmed ? (
                <button
                  onClick={confirmReceipt}
                  disabled={confirmingReceipt}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {confirmingReceipt ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Plus size={16} /> Add ${receiptResult.total.toFixed(2)} to Transactions</>
                  )}
                </button>
              ) : (
                <div className="w-full rounded-xl bg-green-50 border border-green-200 p-3 text-center">
                  <p className="text-sm font-medium text-green-700 flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={16} /> Transaction added to your account
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* History + Wishlist */}
      {mode === "purchase" && (history.length > 0 || wishlist.length > 0) && (
        <div className="space-y-4 pt-4 border-t border-border">
          {/* Wishlist */}
          {wishlist.length > 0 && (
            <div className="rounded-2xl bg-card border border-border p-5">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Bookmark size={16} className="text-primary" /> Saved for Later ({wishlist.length})
              </h3>
              <div className="space-y-2">
                {wishlist.map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.product}</p>
                      <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <VerdictBadge verdict={item.verdict} />
                      <button onClick={() => removeFromWishlist(item._id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-2xl bg-card border border-border p-5">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between text-sm font-bold text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Clock size={16} className="text-muted-foreground" /> Recent Analyses ({history.length})
                </span>
                {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showHistory && (
                <div className="mt-3 space-y-2">
                  {history.map((item) => (
                    <div key={item._id} className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.product}</p>
                        <p className="text-xs text-muted-foreground">
                          ${item.price.toFixed(2)} &middot; {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <VerdictBadge verdict={item.verdict} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
