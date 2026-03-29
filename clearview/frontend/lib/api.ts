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
  return process.env.NEXT_PUBLIC_VERAFUND_USER_ID || "";
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
  loans: { name: string; balance: number; rate: number; monthly: number; lender: string }[];
}

export function submitOnboarding(data: OnboardingPayload): Promise<{ status: string; onboarding_complete: boolean }> {
  return post<{ status: string; onboarding_complete: boolean }>("/api/auth/onboarding", data);
}

// ── Dashboard ────────────────────────────────────────────────
export interface DashboardData {
  user: Record<string, unknown>;
  financial_profile: Record<string, unknown> | null;
  accounts: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
  recent_transactions: Transaction[];
  virtual_cards: VirtualCard[];
  pending_alerts: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
  monthly_summary: MonthlySummary;
  upcoming_bills: UpcomingBill[];
  quick_stats: QuickStats;
  net_worth: number;
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

export function fetchCards(userId: string): Promise<{ cards: VirtualCard[] }> {
  return get<{ cards: VirtualCard[] }>(`/api/cards/${userId}`);
}

export function fetchTransactions(userId: string): Promise<{ transactions: Transaction[] }> {
  return get<{ transactions: Transaction[] }>(`/api/transactions/${userId}`);
}

export function fetchAlerts(userId: string): Promise<{ alerts: Record<string, unknown>[] }> {
  return get<{ alerts: Record<string, unknown>[] }>(`/api/alerts/${userId}`);
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
