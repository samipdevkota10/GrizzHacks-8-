export const USER = {
  name: "Alex Morgan",
  email: "alex@verafund.app",
  avatar: "/images/avatar1.png",
  hourlyRate: 42.5,
  monthlyIncome: 6800,
  taxRate: 0.28,
  netHourlyRate: 42.5 * (1 - 0.28),
};

export const NET_WORTH = {
  total: 47_820,
  change: 2_340,
  changePercent: 5.14,
  assets: 62_400,
  liabilities: 14_580,
};

export const MONTHLY = {
  income: 6_800,
  spending: 4_120,
  savings: 2_680,
  savingsRate: 39.4,
  budgetTotal: 4_500,
  budgetUsed: 4_120,
};

export const SPENDING_BY_CATEGORY = [
  { name: "Housing", amount: 1_450, color: "#E53E0B", percent: 35.2 },
  { name: "Food & Dining", amount: 620, color: "#F97316", percent: 15.0 },
  { name: "Transportation", amount: 380, color: "#FBBF24", percent: 9.2 },
  { name: "Subscriptions", amount: 285, color: "#A16207", percent: 6.9 },
  { name: "Shopping", amount: 460, color: "#DC2626", percent: 11.2 },
  { name: "Health", amount: 180, color: "#16A34A", percent: 4.4 },
  { name: "Entertainment", amount: 320, color: "#7C3AED", percent: 7.8 },
  { name: "Other", amount: 425, color: "#94A3B8", percent: 10.3 },
];

export const MONTHLY_TREND = [
  { month: "Oct", income: 6800, spending: 3900 },
  { month: "Nov", income: 6800, spending: 4200 },
  { month: "Dec", income: 7200, spending: 5100 },
  { month: "Jan", income: 6800, spending: 3800 },
  { month: "Feb", income: 6800, spending: 4300 },
  { month: "Mar", income: 6800, spending: 4120 },
];

export const BUDGET_CATEGORIES = [
  { name: "Housing", budget: 1500, spent: 1450, color: "#E53E0B" },
  { name: "Food & Dining", budget: 700, spent: 620, color: "#F97316" },
  { name: "Transportation", budget: 400, spent: 380, color: "#FBBF24" },
  { name: "Shopping", budget: 400, spent: 460, color: "#DC2626" },
  { name: "Entertainment", budget: 350, spent: 320, color: "#7C3AED" },
  { name: "Subscriptions", budget: 300, spent: 285, color: "#A16207" },
];

export const TRANSACTIONS = [
  { id: 1, merchant: "Whole Foods Market", category: "Food & Dining", amount: -67.42, date: "Mar 28", logo: "wholefoodsmarket.com" },
  { id: 2, merchant: "Spotify Premium", category: "Subscriptions", amount: -9.99, date: "Mar 27", logo: "spotify.com" },
  { id: 3, merchant: "Shell Gas Station", category: "Transportation", amount: -48.30, date: "Mar 27", logo: "shell.com" },
  { id: 4, merchant: "Direct Deposit — Acme Corp", category: "Income", amount: 3400.00, date: "Mar 26", logo: null },
  { id: 5, merchant: "Amazon", category: "Shopping", amount: -129.99, date: "Mar 25", logo: "amazon.com" },
  { id: 6, merchant: "Netflix", category: "Subscriptions", amount: -15.49, date: "Mar 25", logo: "netflix.com" },
  { id: 7, merchant: "Uber", category: "Transportation", amount: -23.50, date: "Mar 24", logo: "uber.com" },
  { id: 8, merchant: "Chipotle", category: "Food & Dining", amount: -14.85, date: "Mar 24", logo: "chipotle.com" },
  { id: 9, merchant: "Planet Fitness", category: "Health", amount: -24.99, date: "Mar 23", logo: "planetfitness.com" },
  { id: 10, merchant: "Target", category: "Shopping", amount: -86.32, date: "Mar 22", logo: "target.com" },
];

export const UPCOMING_BILLS = [
  { name: "Rent", amount: 1450, dueDate: "Apr 1", autopay: true },
  { name: "Car Insurance", amount: 142, dueDate: "Apr 5", autopay: true },
  { name: "Electric Bill", amount: 95, dueDate: "Apr 8", autopay: false },
  { name: "Internet", amount: 69.99, dueDate: "Apr 10", autopay: true },
  { name: "Student Loan", amount: 320, dueDate: "Apr 15", autopay: true },
];

export const SUBSCRIPTIONS = [
  { name: "Spotify", amount: 9.99, cycle: "monthly", category: "Music", logo: "spotify.com" },
  { name: "Netflix", amount: 15.49, cycle: "monthly", category: "Streaming", logo: "netflix.com" },
  { name: "ChatGPT Plus", amount: 20.00, cycle: "monthly", category: "AI Tools", logo: "openai.com" },
  { name: "iCloud+", amount: 2.99, cycle: "monthly", category: "Cloud", logo: "apple.com" },
  { name: "Adobe CC", amount: 54.99, cycle: "monthly", category: "Design", logo: "adobe.com" },
  { name: "Planet Fitness", amount: 24.99, cycle: "monthly", category: "Health", logo: "planetfitness.com" },
];

export const CARDS = [
  { id: "1", name: "Chase Sapphire", last4: "4821", type: "credit" as const, balance: 2_340, limit: 12_000, color: "#1F1F1F" },
  { id: "2", name: "Vera Fund Debit", last4: "7392", type: "debit" as const, balance: 8_420, limit: null, color: "#E53E0B" },
  { id: "3", name: "Amex Gold", last4: "3056", type: "credit" as const, balance: 890, limit: 8_000, color: "#A16207" },
  { id: "4", name: "Discover It", last4: "9184", type: "credit" as const, balance: 0, limit: 5_000, color: "#7C3AED" },
];

export const LOANS = [
  { name: "Student Loan", balance: 8_200, rate: 4.5, monthlyPayment: 320, originalAmount: 28_000 },
  { name: "Car Loan", balance: 6_380, rate: 3.9, monthlyPayment: 280, originalAmount: 18_000 },
];

export const FINANCIAL_GOALS = [
  { name: "Emergency Fund", target: 15_000, current: 8_400, icon: "Shield" as const },
  { name: "Vacation Fund", target: 3_000, current: 1_850, icon: "Plane" as const },
  { name: "Pay Off Student Loan", target: 8_200, current: 0, icon: "GraduationCap" as const },
];
