export interface Account {
  _id: string;
  user_id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment" | "loan";
  balance: number;
  currency: string;
  institution_name: string;
  institution_logo_url: string | null;
  is_primary_checking: boolean;
  color: string;
  is_active: boolean;
}

export interface Transaction {
  _id: string;
  user_id: string;
  account_id: string;
  virtual_card_id: string | null;
  amount: number;
  currency: string;
  merchant_name: string;
  merchant_logo_url: string | null;
  category: string;
  subcategory: string | null;
  description: string | null;
  date: string;
  is_recurring: boolean;
  anomaly_flag: boolean;
  anomaly_alert_id: string | null;
  tags: string[];
  ai_summary: string | null;
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
  status: "active" | "paused" | "destroyed";
  spending_limit_monthly: number;
  spent_this_month: number;
  last_known_amount: number | null;
  color_scheme: string;
  created_at: string;
  paused_at: string | null;
  destroyed_at: string | null;
  total_charged_lifetime: number;
  charge_count: number;
}

export interface Subscription {
  _id: string;
  user_id: string;
  virtual_card_id: string | null;
  name: string;
  logo_url: string | null;
  amount: number;
  billing_cycle: string;
  next_billing_date: string;
  category: string;
  status: "active" | "paused" | "cancelled";
  usage_score: number | null;
  ai_cancel_recommendation: boolean;
  last_known_amount: number | null;
}

export interface AnomalyAlert {
  _id: string;
  user_id: string;
  subscription_id: string | null;
  virtual_card_id: string;
  merchant_name: string;
  last_known_amount: number;
  incoming_amount: number;
  delta_pct: number;
  threshold_pct: number;
  status: "pending" | "approved_once" | "limit_updated" | "declined";
  action_taken: string | null;
  action_taken_at: string | null;
  created_at: string;
  is_read: boolean;
}

export interface FinancialProfile {
  _id: string;
  user_id: string;
  monthly_income: number;
  monthly_budget: number;
  category_budgets: Record<string, number>;
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
  savings_goal_monthly: number;
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

export interface DashboardData {
  user: {
    _id: string;
    name: string;
    email: string;
    vera_name: string;
    preferences: Record<string, unknown>;
  };
  financial_profile: FinancialProfile;
  accounts: Account[];
  subscriptions: Subscription[];
  recent_transactions: Transaction[];
  virtual_cards: VirtualCard[];
  pending_alerts: AnomalyAlert[];
  notifications: { _id: string; type: string; title: string; message: string; is_read: boolean }[];
  monthly_summary: MonthlySummary;
  upcoming_bills: UpcomingBill[];
  quick_stats: QuickStats;
  net_worth: number;
}

export interface ChatMessage {
  role: "user" | "vera";
  content: string;
  timestamp: string;
  purchase_check?: {
    product: string;
    price: number;
    verdict: string;
    reasoning: string;
  };
}

export interface Conversation {
  _id: string;
  session_id: string;
  mode: string;
  messages: ChatMessage[];
  started_at: string;
}
