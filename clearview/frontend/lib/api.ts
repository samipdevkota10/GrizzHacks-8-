/** Base URL with no trailing slash — a trailing slash in env breaks paths (`//api/...` → 404 on Railway). */
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

// ── Auth token helpers ───────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("verafund_token");
}

export function setToken(token: string): void {
  localStorage.setItem("verafund_token", token);
}

export function clearAuth(): void {
  localStorage.removeItem("verafund_token");
  localStorage.removeItem("verafund_user_id");
}

export function getUserId(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("verafund_user_id");
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_CLEARVIEW_USER_ID || "";
}

export function setUserId(id: string): void {
  localStorage.setItem("verafund_user_id", id);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

async function postForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

async function patch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

// ── Auth API ─────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  user_id: string;
  user: Record<string, unknown>;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Login failed (${res.status})`);
  }
  const data: AuthResponse = await res.json();
  setToken(data.token);
  setUserId(data.user_id);
  return data;
}

export async function signup(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Signup failed (${res.status})`);
  }
  const data: AuthResponse = await res.json();
  setToken(data.token);
  setUserId(data.user_id);
  return data;
}

// ── Onboarding ───────────────────────────────────────────────
export interface OnboardingPayload {
  monthly_income: number;
  employment_type: string;
  employer_name: string;
  pay_frequency: string;
  hourly_rate: number;
  tax_rate: number;
  monthly_budget: number;
  savings_goal_monthly: number;
  phone_number: string;
  currency: string;
  financial_goals: { name: string; target_amount: number; current_amount: number }[];
  category_budgets: Record<string, number>;
  accounts: { name: string; type: string; balance: number; institution: string }[];
  cards: { name: string; last4: string; type: "credit" | "debit" }[];
  loans: { name: string; balance: number; rate: number; monthly: number; lender: string }[];
}

export function submitOnboarding(data: OnboardingPayload): Promise<{ status: string; onboarding_complete: boolean }> {
  return post<{ status: string; onboarding_complete: boolean }>("/api/auth/onboarding", data);
}

export interface OnboardingDraftResponse {
  step: number;
  data: Record<string, unknown>;
  updated_at: string | null;
}

export function fetchOnboardingDraft(): Promise<OnboardingDraftResponse> {
  return get<OnboardingDraftResponse>("/api/auth/onboarding/draft");
}

export function saveOnboardingDraft(step: number, data: Record<string, unknown>): Promise<{ status: string }> {
  return patch<{ status: string }>("/api/auth/onboarding/draft", { step, data });
}

export function plaidSandboxBootstrap(): Promise<{
  status: string;
  item_id: string;
  accounts_imported: number;
  transactions_imported: number;
  subscriptions_detected: number;
}> {
  return post("/api/plaid/sandbox/bootstrap");
}

export function syncPlaid(): Promise<{
  status: string;
  accounts_imported: number;
  transactions_imported: number;
  subscriptions_detected: number;
}> {
  return post("/api/plaid/sync");
}

// ── Dashboard ────────────────────────────────────────────────
export interface DailySnapshot {
  status: "on_track" | "watch" | "at_risk";
  message: string;
  net_worth_delta_30d: number;
  cashflow_delta_30d: number;
}

export interface ActionItem {
  id: string;
  type: "bill_risk" | "budget_overrun" | "subscription_creep" | "goal_slip" | "fraud_alert";
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  score: number;
  cta_label: string;
  cta_route: string;
  metadata: Record<string, unknown>;
}

export interface BudgetPulse {
  spent_to_date: number;
  days_elapsed: number;
  days_in_month: number;
  burn_rate_daily: number;
  projected_month_spend: number;
  forecast_remaining: number;
  status: "safe" | "warning" | "critical";
}

export interface BillRisk {
  due_7d_total: number;
  due_14d_total: number;
  due_30d_total: number;
  checking_buffer_after_30d: number;
  risk_level: "safe" | "watch" | "critical";
  at_risk_bills: { name: string; amount: number; date: string }[];
}

export interface AppNotification {
  _id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  created_at: string;
  read_at?: string | null;
}

export interface DashboardData {
  user: Record<string, unknown>;
  financial_profile: Record<string, unknown> | null;
  accounts: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
  recent_transactions: Transaction[];
  virtual_cards: VirtualCard[];
  pending_alerts: Record<string, unknown>[];
  notifications: AppNotification[];
  monthly_summary: MonthlySummary;
  upcoming_bills: UpcomingBill[];
  quick_stats: QuickStats;
  net_worth: number;
  daily_snapshot?: DailySnapshot;
  action_center?: ActionItem[];
  budget_pulse?: BudgetPulse;
  bill_risk?: BillRisk;
}

export interface MonthlySummary {
  spent: number;
  income: number;
  budget: number;
  remaining: number;
  by_category: Record<string, number>;
}

export interface QuickStats {
  avg_daily_spend: number;
  top_category: string;
  top_category_amount: number;
  days_until_paycheck: number;
}

export interface UpcomingBill {
  name: string;
  amount: number;
  date: string;
  logo_url: string | null;
}

export interface Transaction {
  _id: string;
  user_id: string;
  account_id: string;
  virtual_card_id?: string | null;
  amount: number;
  currency: string;
  merchant_name: string;
  merchant_logo_url: string | null;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  date: string;
  is_recurring: boolean;
  anomaly_flag: boolean;
  tags: string[];
  ai_summary?: string | null;
  created_at: string;
  status?: string;
}

export interface VirtualCard {
  _id: string;
  user_id: string;
  stripe_card_id: string;
  nickname: string;
  merchant_name: string;
  merchant_logo_url: string | null;
  merchant_category: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  status: string;
  spending_limit_monthly: number;
  spent_this_month: number;
  last_known_amount: number;
  funding_account_id: string;
  color_scheme: string;
  created_at: string;
  paused_at: string | null;
  destroyed_at: string | null;
  total_charged_lifetime: number;
  charge_count: number;
}

export interface Subscription {
  _id: string;
  name: string;
  amount: number;
  billing_cycle: string;
  next_billing_date: string;
  category: string;
  status: string;
  usage_score: number;
  ai_cancel_recommendation: boolean;
  logo_url: string | null;
}

export function fetchDashboard(userId: string): Promise<DashboardData> {
  return get<DashboardData>(`/api/dashboard/${userId}`);
}

export function postDashboardEvent(
  userId: string,
  eventName: string,
  eventPayload: Record<string, unknown> = {},
): Promise<{ status: string }> {
  return post<{ status: string }>("/api/dashboard/events", {
    user_id: userId,
    event_name: eventName,
    event_payload: eventPayload,
  });
}

export function patchPurchaseAnalysis(
  analysisId: string,
  corrections: { product?: string; price?: number; currency?: string },
): Promise<Record<string, unknown>> {
  return patch<Record<string, unknown>>(`/api/advisor/purchase-analysis/${analysisId}`, corrections);
}

export function fetchCards(userId: string): Promise<{ cards: VirtualCard[] }> {
  return get<{ cards: VirtualCard[] }>(`/api/cards/${userId}`);
}

export interface CreateCardPayload {
  user_id: string;
  merchant_name?: string;
  nickname?: string;
  spending_limit_monthly?: number;
  merchant_category?: string;
  funding_account_id?: string;
  color_scheme?: string;
}

export function createCard(payload: CreateCardPayload): Promise<{ card: VirtualCard }> {
  return post<{ card: VirtualCard }>("/api/cards", payload);
}

export function pauseCard(cardId: string): Promise<{ card: VirtualCard; message: string }> {
  return patch<{ card: VirtualCard; message: string }>(`/api/cards/${cardId}/pause`);
}

export function deleteCard(cardId: string): Promise<{ message: string; card_id: string }> {
  return del<{ message: string; card_id: string }>(`/api/cards/${cardId}`);
}

export function updateCardLimit(cardId: string, spending_limit_monthly: number): Promise<{ message: string }> {
  return patch<{ message: string }>(`/api/cards/${cardId}/limit`, { spending_limit_monthly });
}

export function fetchTransactions(userId: string): Promise<{ transactions: Transaction[] }> {
  return get<{ transactions: Transaction[] }>(`/api/transactions/${userId}`);
}

export function fetchAlerts(userId: string): Promise<{ alerts: Record<string, unknown>[] }> {
  return get<{ alerts: Record<string, unknown>[] }>(`/api/alerts/${userId}`);
}

export function fetchNotifications(
  userId: string,
  unreadOnly = false,
): Promise<{ notifications: AppNotification[] }> {
  return get<{ notifications: AppNotification[] }>(
    `/api/notifications/${userId}?unread_only=${unreadOnly}&limit=30`,
  );
}

export function markNotificationRead(notificationId: string): Promise<{ status: string }> {
  return patch<{ status: string }>(`/api/notifications/${notificationId}/read`);
}

export function markAllNotificationsRead(userId: string): Promise<{ status: string; marked: number }> {
  return post<{ status: string; marked: number }>("/api/notifications/mark-all-read", { user_id: userId });
}

// ── Advisor ──────────────────────────────────────────────────
export interface ChatResponse {
  response: string;
  conversation_id: string;
}

export function sendChat(
  userId: string,
  message: string,
  conversationId?: string,
): Promise<ChatResponse> {
  return post<ChatResponse>("/api/advisor/chat", {
    user_id: userId,
    message,
    conversation_id: conversationId,
  });
}

export interface PurchaseCheckResponse {
  product: string;
  price: number;
  currency: string;
  verdict: "yes" | "no" | "careful";
  reasoning: string;
  conversation_id: string;
}

export function purchaseCheck(
  userId: string,
  imageFile: File,
): Promise<PurchaseCheckResponse> {
  const fd = new FormData();
  fd.append("user_id", userId);
  fd.append("image", imageFile);
  return postForm<PurchaseCheckResponse>("/api/advisor/purchase-check", fd);
}

// ── Purchase History & Wishlist ───────────────────────────────

export function fetchPurchaseHistory(
  userId: string,
  limit = 10,
): Promise<{ analyses: { _id: string; product: string; price: number; verdict: string; created_at: string; confidence?: number | null; corrected_by_user?: boolean }[] }> {
  return get(`/api/advisor/purchase-history/${userId}?limit=${limit}`);
}

export function fetchWishlist(
  userId: string,
): Promise<{ items: { _id: string; product: string; price: number; verdict: string; created_at: string }[] }> {
  return get(`/api/advisor/wishlist/${userId}`);
}

export function addToWishlist(payload: {
  user_id: string;
  product: string;
  price: number;
  verdict: string;
  reasoning: string;
  analysis_id?: string;
}): Promise<{ status: string }> {
  return post("/api/advisor/wishlist", payload);
}

export function removeFromWishlist(itemId: string): Promise<{ status: string }> {
  return del(`/api/advisor/wishlist/${itemId}`);
}

export function scanReceipt(
  userId: string,
  imageFile: File,
): Promise<Record<string, unknown>> {
  const fd = new FormData();
  fd.append("user_id", userId);
  fd.append("image", imageFile);
  return postForm("/api/advisor/scan-receipt", fd);
}

export function confirmReceipt(scanId: string): Promise<{ status: string }> {
  return post(`/api/advisor/scan-receipt/${scanId}/confirm`, {});
}

// ── Card Optimizer ───────────────────────────────────────────

export interface CardRecommendation {
  card_name: string;
  issuer: string;
  last4: string;
  effective_reward_pct: number;
  cashback_amount: number;
  quarterly_info: string | null;
  is_best: boolean;
}

export function fetchCardRecommendation(
  userId: string,
  category: string,
  amount: number,
): Promise<{ recommendations: CardRecommendation[] }> {
  return get(`/api/card-optimizer/${userId}/recommend?category=${encodeURIComponent(category)}&amount=${amount}`);
}

export function fetchWeeklyDigest(
  userId: string,
): Promise<{ digest: Record<string, unknown> }> {
  return get(`/api/card-optimizer/${userId}/weekly-digest`);
}

// ── Predictions ──────────────────────────────────────────────

export interface CategoryPrediction {
  category: string;
  predicted: number;
  budgeted: number;
  over_budget: boolean;
}

export interface NextMonthPrediction {
  predictions: CategoryPrediction[];
  total_predicted: number;
  total_budget: number;
}

export function fetchNextMonthPrediction(
  userId: string,
): Promise<NextMonthPrediction> {
  return get(`/api/predictions/${userId}/next-month`);
}

export interface CashFlowDay {
  date: string;
  balance: number;
  event: string | null;
}

export function fetchCashFlowForecast(
  userId: string,
): Promise<{ forecast: CashFlowDay[]; danger_zone_threshold: number }> {
  return get(`/api/predictions/${userId}/cash-flow`);
}

// ── Search ───────────────────────────────────────────────────

export interface SearchResult {
  type: "transaction" | "subscription" | "card";
  _id: string;
  title: string;
  subtitle: string;
  amount?: number;
  date?: string;
  route: string;
}

export function searchDashboard(
  userId: string,
  query: string,
): Promise<{ results: SearchResult[] }> {
  return get(`/api/search/${userId}?q=${encodeURIComponent(query)}`);
}

// ── Monthly Trend ────────────────────────────────────────────

export function fetchMonthlyTrend(
  userId: string,
  months = 6,
): Promise<{ trend: { month: string; income: number; spending: number }[] }> {
  return get(`/api/dashboard/${userId}/monthly-trend?months=${months}`);
}

// ── Advisor Voice Calls ──────────────────────────────────────

export type AdvisorCallStatus = "calling" | "completed" | "no_answer" | "failed" | "mock";

export interface AdvisorActionRequest {
  type: string;
  target_name: string;
  user_consent_quote: string;
  confidence: "high" | "medium" | "low";
}

export interface AdvisorCallSummary {
  _id: string;
  session_id: string;
  mode: string;
  status: AdvisorCallStatus;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  phone_last4: string;
  summary: string | null;
  key_topics: string[];
  next_steps: string[];
  action_requests: AdvisorActionRequest[];
  safety_flags: string[];
}

export interface StartCallResponse {
  success: boolean;
  conversation_id: string;
  session_id: string;
  status: AdvisorCallStatus;
  started_at: string;
  phone_last4: string;
  mock: boolean;
}

/** Parse FastAPI HTTPException detail (string or { message, hint, code }). */
function extractFastApiErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as { detail?: unknown };
  const det = d.detail;
  if (typeof det === "string") return det;
  if (det && typeof det === "object") {
    const o = det as { message?: string; hint?: string };
    if (o.message && o.hint) return `${o.message} ${o.hint}`;
    if (o.message) return o.message;
    if (o.hint) return o.hint;
  }
  return "";
}

export async function startAdvisorCall(userId: string): Promise<StartCallResponse> {
  const res = await fetch(`${API_URL}/api/advisor/call/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ user_id: userId }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      extractFastApiErrorMessage(data) ||
      (typeof data.detail === "string" ? data.detail : "") ||
      `Could not start call (${res.status})`;
    throw new Error(msg);
  }
  return data as unknown as StartCallResponse;
}

export function submitAdvisorCallResult(payload: {
  conversation_id: string;
  status: string;
  transcript?: string;
  duration_seconds?: number;
  provider_payload?: Record<string, unknown>;
}): Promise<{ message: string; conversation_id: string; summary_generated: boolean }> {
  return post("/api/advisor/call-result", payload);
}

export function fetchAdvisorCalls(
  userId: string,
  limit = 5,
): Promise<{ calls: AdvisorCallSummary[] }> {
  return get<{ calls: AdvisorCallSummary[] }>(`/api/advisor/calls/${userId}?limit=${limit}`);
}

// ── In-browser voice session ─────────────────────────────────

export interface VoiceSessionResponse {
  signed_url: string;
  agent_id: string;
  conversation_id: string;
  session_id: string;
  overrides: {
    agent: {
      prompt: { prompt: string };
      firstMessage: string;
    };
  };
  dynamic_variables: Record<string, string>;
}

export async function createVoiceSession(userId: string): Promise<VoiceSessionResponse> {
  const res = await fetch(`${API_URL}/api/advisor/voice-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ user_id: userId }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg = extractFastApiErrorMessage(data) || `Voice session failed (${res.status})`;
    throw new Error(msg);
  }
  return data as unknown as VoiceSessionResponse;
}
