# Clearview — Personal Finance OS

## Product Requirements Document (Merged)

**Version:** 1.0 — Hackathon MVP
**Date:** March 2026
**Status:** Ready to Build
**Tech Stack:** Next.js 15 | FastAPI | MongoDB | Gemini 1.5 | ElevenLabs | Stripe Issuing | Solana

---

## 1. Problem Statement

Consumers lose hundreds of dollars annually to forgotten subscriptions, stealth price hikes, and deliberately hostile cancellation flows. Existing tools either monitor spending passively after money has left (Rocket Money, Mint) or provide generic AI advice disconnected from real financial data. No product today gives users:

- **Deterministic, pre-authorization control** over payment rails
- **AI advice grounded in their actual dollars** — not generic tips
- **A single interface** that unifies dashboard, advisor, and card management

Clearview closes all three gaps.

---

## 2. Product Vision

Clearview is the first Personal Finance OS that knows you completely — every dollar, every subscription, every financial decision — and gives you an AI advisor, a watchful dashboard, and direct control over your payment rails, all wrapped in the most beautiful financial interface ever built for a normal person.

**Tagline:** "Every dollar, crystal clear."

---

## 3. Target Personas

### Persona 1: Alex, 22 — College Student

| Attribute | Detail |
|---|---|
| Pain Points | No idea where money goes. Scared to check balance. Forgets about subscriptions. |
| Goal | Understand spending in 30 seconds. Know if he can afford something without checking 5 apps. |
| Key Features | Dashboard overview, "Can I afford this?" camera, AI character that speaks plainly |
| Tech Comfort | High — uses TikTok, Venmo, Apple Pay daily |

### Persona 2: Maya, 27 — Early Career Professional

| Attribute | Detail |
|---|---|
| Pain Points | Paying for 14 subscriptions, 4 forgotten. Worried about subscription creep and unannounced price hikes. |
| Goal | See exactly what she's paying for, kill anything she doesn't use, get alerted before price increases hit. |
| Key Features | Subscription tracker, virtual card kill-switch, spending limit alerts, anomaly detection |
| Tech Comfort | Medium-high — uses Google Pay, has a 401k she never logs into |

---

## 4. Feature Specifications

### F-001: Financial Dashboard

The main screen. First thing judges see. Must be immediately impressive and comprehensible.

**Components:**

- **Net Worth Card:** Total assets minus liabilities. Large number. Green/red trend arrow.
- **Spending Donut Chart:** This month's spending broken into 8 categories. Animated on load. Color-coded.
- **Monthly Trend Line Chart:** 6-month spending vs income area chart (Recharts).
- **Discretionary Budget Bar:** Progress bar showing $X of $Y remaining this month. Red when under 20%.
- **Subscription Grid:** Cards for each active subscription with logo, amount, renewal date, virtual card status.
- **Recent Transactions Feed:** Last 10 transactions with merchant icon, category, amount, date.
- **Quick Stats Row:** Avg daily spend / Biggest category this month / Days until paycheck.

**Design Requirements:**

- Dark mode by default. Deep navy (`#0A0F1E`) background. Glassmorphism cards (`bg-white/5 backdrop-blur border-white/10`).
- Brand colors: Electric blue (`#4F8EF7`) accents. White text. Green (`#00D26A`) for positive, red (`#FF4757`) for negative.
- Font: Inter. Weights 400, 500, 600 only.
- All charts animate on load.
- Responsive grid: 3 columns on desktop, 1 on mobile.

**Acceptance Criteria:** Dashboard loads in <2s with all charts populated and animated.

---

### F-002: AI Financial Advisor (Gemini) — "Vera"

A chat interface that knows everything about your finances and gives hyper-specific answers — never generic advice.

**Context Injection (injected before every Gemini call):**

- Full transaction history (last 90 days)
- All account balances
- Active subscriptions and amounts
- Budget limits per category
- Upcoming bills (next 30 days)
- Net worth and trend
- Previous conversation history (cross-session via MongoDB)

**System Prompt Template:**

```
You are Vera, a personal financial advisor for {user_name}. You have complete access to their financial data.

FINANCIAL SNAPSHOT:
- Net Worth: ${net_worth}
- Checking Balance: ${checking_balance}
- This Month Spent: ${month_spent} of ${month_budget} budget
- Discretionary Left: ${discretionary_remaining}
- Active Subscriptions: {subscription_count} totaling ${subscription_total}/month
- Biggest Spend Category: {top_category} (${top_amount})
- Upcoming Bills (30 days): ${upcoming_total}

RULES:
1. ALWAYS cite specific dollar amounts from the user's actual data
2. NEVER give generic advice — every answer must reference their specific situation
3. If asked 'can I afford X', calculate it explicitly
4. Be direct, warm, and honest. Do not sugarcoat bad financial news.
5. Keep responses under 150 words unless a detailed breakdown is explicitly requested
```

**UI Requirements:**

- Slide-in panel from the right side of dashboard
- Conversation history persists across sessions
- Typing indicator animation while Gemini processes
- Quick-action chips: "Can I afford this?", "Where did my money go?", "Should I cancel any subscriptions?"

**Acceptance Criteria:** Every response cites specific dollar amounts from the user's data. Zero generic answers.

---

### F-003: "Can I Afford This?" Camera Feature

The single most demoable feature. User photographs any product. Gemini Vision reads the price. Vera answers with full financial context.

**Flow:**

1. User taps camera icon in the advisor panel.
2. Camera view opens (or file upload on desktop).
3. User photographs a product / price tag / receipt.
4. Image sent to Gemini 1.5 Flash Vision API.
5. Gemini extracts: `{product, price, currency}`.
6. Extracted data + financial snapshot injected into advisor prompt.
7. Advisor responds with specific yes/no + financial reasoning.
8. Optional: ElevenLabs reads the response aloud.

**Vision Extraction Prompt:**

```
Analyze this image and extract the product and price.
Return ONLY a JSON object: {"product": "name", "price": 00.00, "currency": "USD"}.
If no price is visible, estimate based on product type.
```

**Example Response:**

> You're looking at the Nike Air Force 1 for $120. Here's the honest answer: you have $340 in your discretionary budget this month, but your car insurance of $189 hits in 8 days. After that, you'd have $151 left. The shoes would leave you with $31 for the rest of the month. That's tight — especially since you spent $67 at restaurants last week. My recommendation: wait until next month.

**Acceptance Criteria:** Photo to answer in <5 seconds, citing real balance and upcoming bills.

---

### F-004: Virtual Card Manager (Stripe Issuing)

Users create merchant-locked virtual cards, set hard spending limits, and destroy them instantly. The "kill switch" feature.

**Card Properties:**

| Property | Description | Default |
|---|---|---|
| Card Number | 16-digit virtual card (Stripe generated) | Auto-generated |
| Merchant Lock | Card can ONLY be charged by assigned merchant | Enabled |
| Spending Limit | Hard monthly cap — charges above auto-declined | Set by user |
| Status | Active / Paused / Destroyed | Active |
| Nickname | User-defined (e.g., "Netflix card") | Merchant name |
| Last Charged | Most recent successful transaction | Auto-updated |

**Key Capabilities:**

- **Pause:** Temporarily suspends all authorizations. Card can be resumed.
- **Destroy:** Permanently deactivates the card. No further charges possible. No merchant cooperation required.
- **Limit Enforcement:** Auth requests exceeding the cap are auto-declined.

**Kill-Switch Demo Script:**

> "I've been paying for a gym I haven't visited in 4 months. Watch this." [Click Destroy Card] "Done. That $45 can never be charged to me again. No phone call. No cancellation portal. No 'are you sure?' forms. The money simply cannot leave my account."

**Acceptance Criteria:** Card destroyed in 1 click, status updates immediately, destroy animation is dramatic (card flips and shatters or fades with shake).

---

### F-005: Subscription Creep Detection (Anomaly Alerts)

Proactive detection of unannounced price increases — the feature that shifts from reactive monitoring to deterministic control.

**Logic:**

- Track each subscription's historical charge amount per card.
- On each new charge, compare incoming amount against the last known amount.
- If delta exceeds a configurable threshold (default: 5%), flag as anomaly.
- Push notification + in-app alert with three options:
  - **Approve Once** — allow this charge, keep the old limit.
  - **Approve & Update Limit** — allow and set this as the new baseline.
  - **Decline & Pause Card** — reject the charge and freeze the card.

**Example:**

> Netflix was $15.99/month. This month they're charging $17.99. That's a 12.5% increase.
> [Approve Once] [Update Limit to $17.99] [Decline & Pause]

**Implementation (Hackathon):**

- Store `last_known_amount` per subscription in MongoDB.
- On simulated charge in demo, compare amounts and trigger UI alert if threshold breached.
- No real-time webhook needed for MVP — simulate the flow with a button or seeded data.

**Acceptance Criteria:** Price increase on a subscription triggers a visible alert with the three action options. Alert shows old price, new price, and percentage change.

---

### F-006: AI Financial Character — Voice & Video (ElevenLabs)

A persistent, personalized AI financial advisor persona users interact with via text, voice, and video call.

**Character Design:**

| Attribute | Specification |
|---|---|
| Name | Vera (user can rename) |
| Voice | ElevenLabs custom voice — professional, warm, calm, trustworthy |
| Personality | Direct and honest. Never sugarcoats. Plain English. Slightly dry humor. Always on your side. |
| Memory | Remembers user's name, goals, previous conversations, major financial events |

**Interaction Modes:**

- **Text Chat:** Standard chat interface within the dashboard panel.
- **Voice Call:** Tap microphone — ElevenLabs STT captures speech, Gemini processes, ElevenLabs TTS responds with Vera's voice.
- **Video Call:** Full-screen modal with animated Vera avatar + voice.

**Voice Call Flow:**

1. User taps "Call Vera" button.
2. Full-screen modal opens with animated Vera avatar (pulsing gradient circle).
3. ElevenLabs intro: "Hey [name], how can I help with your finances today?"
4. User speaks — ElevenLabs STT transcribes in real-time.
5. Transcript + financial context sent to Gemini.
6. Gemini response sent to ElevenLabs TTS.
7. Vera speaks the answer with natural intonation.
8. Conversation history saved to MongoDB.

**Acceptance Criteria:** Voice call connects, Vera responds with user's specific financial data, latency <1.5s from end of speech to start of response.

---

## 5. User Stories & Acceptance Criteria

| ID | As a... | I want to... | So that... | Acceptance Criteria |
|---|---|---|---|---|
| US-001 | User | See all finances at a glance | I don't need 5 apps | Dashboard loads <2s, all charts populated |
| US-002 | User | Ask if I can afford a purchase | I don't impulse buy | Photo → answer <5s citing real balance |
| US-003 | User | Instantly cancel a subscription | I stop wasting money | Card destroyed in 1 click, status updates immediately |
| US-004 | User | Talk to Vera about my budget | I get advice without reading charts | Voice call connects, Vera cites my specific data |
| US-005 | User | Set a spending limit on a card | I'm protected from overcharges | Charges above limit auto-declined, notification sent |
| US-006 | User | See where my money went | I identify waste | Categorized breakdown in donut chart + table |
| US-007 | User | Get alerted to price hikes | I'm not silently overcharged | Anomaly alert fires with old/new price and action buttons |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Dashboard initial load <2s. AI responses <5s. Camera analysis <3s. Voice latency <1.5s. |
| Availability | 99% uptime during demo window. |
| Security | No real financial credentials stored. All bank data is mock. Stripe sandbox only. API keys backend-only. |
| Scalability | Architecture supports real Plaid integration post-hackathon with minimal refactoring. |
| Usability | Any judge with zero financial knowledge understands every screen within 10 seconds. |
| Compatibility | Chrome and Safari. Responsive but optimized for 1440px desktop. |

---

## 7. Tech Stack & Integrations

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15 + TypeScript | App framework (server components, fast routing) |
| Styling | Tailwind CSS + shadcn/ui | Fastest path to polished UI |
| Charts | Recharts | Financial data visualization, animated |
| Backend | FastAPI (Python) | REST API server, async |
| Database | MongoDB Atlas | Primary data store (flexible schema, sponsor tech) |
| AI | Gemini 1.5 Flash | Financial advisor LLM (text + vision, multimodal) |
| Voice | ElevenLabs Conversational AI | Vera's voice + video call |
| Cards | Stripe Issuing API (sandbox) | Virtual card creation & management |
| Blockchain | Solana (Devnet) | Transaction receipts as NFTs (bonus) |
| Auth | NextAuth.js | User authentication (Google OAuth) |
| Deployment | Vercel (frontend) + Railway (backend) | One-click deploy, free tier |

---

## 8. Data Model

MongoDB document-based. References use ObjectId fields.

### users

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `email` | String | Unique email |
| `name` | String | Display name |
| `avatar_url` | String | Profile picture |
| `vera_character_id` | String | ElevenLabs agent ID |
| `vera_name` | String | Custom AI character name (default: Vera) |
| `financial_profile_id` | ObjectId | Ref: financial_profiles |
| `onboarding_complete` | Boolean | Setup wizard completed |
| `created_at` | DateTime | Account creation |

### financial_profiles

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `user_id` | ObjectId | Ref: users |
| `monthly_income` | Number | Net monthly income after tax |
| `monthly_budget` | Number | Total monthly spending limit |
| `category_budgets` | Object | `{food: 400, transport: 200, ...}` |
| `net_worth` | Number | total_assets - total_liabilities |
| `total_assets` | Number | Sum of all account balances |
| `total_liabilities` | Number | Sum of all debts |
| `savings_goal` | Number | Monthly savings target |
| `last_synced` | DateTime | Last data refresh |

### accounts

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `user_id` | ObjectId | Ref: users |
| `name` | String | e.g., "Chase Checking" |
| `type` | Enum | checking / savings / credit / investment / loan |
| `balance` | Number | Current balance (USD) |
| `institution_name` | String | Bank name |
| `is_primary_checking` | Boolean | Virtual card funding source |
| `is_active` | Boolean | Soft delete flag |

### transactions

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `user_id` | ObjectId | Ref: users |
| `account_id` | ObjectId | Ref: accounts |
| `virtual_card_id` | ObjectId | Ref: virtual_cards (if via virtual card) |
| `amount` | Number | Positive = credit, Negative = debit |
| `merchant_name` | String | e.g., "Chipotle Mexican Grill" |
| `merchant_category` | String | e.g., "Restaurants" |
| `category` | Enum | food / transport / entertainment / shopping / health / utilities / rent / income / other |
| `date` | DateTime | Transaction date |
| `is_recurring` | Boolean | Auto-detected recurring flag |
| `anomaly_flag` | Boolean | Flagged by creep detection |
| `ai_summary` | String | AI-generated one-line summary |

### virtual_cards

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `user_id` | ObjectId | Ref: users |
| `stripe_card_id` | String | Stripe Issuing card ID |
| `nickname` | String | User name, e.g., "Netflix Card" |
| `merchant_name` | String | Locked merchant |
| `merchant_logo` | String | Logo URL |
| `last4` | String | Last 4 digits |
| `status` | Enum | active / paused / destroyed |
| `spending_limit_monthly` | Number | Hard monthly cap (USD) |
| `spent_this_month` | Number | Running total for current month |
| `last_known_amount` | Number | Last charge amount (for anomaly detection) |
| `total_charged` | Number | Lifetime total |
| `charge_count` | Number | Successful charge count |

### subscriptions

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `user_id` | ObjectId | Ref: users |
| `virtual_card_id` | ObjectId | Ref: virtual_cards |
| `name` | String | Service name, e.g., "Netflix" |
| `logo_url` | String | Service logo |
| `amount` | Number | Billing amount per cycle |
| `billing_cycle` | Enum | monthly / annual / weekly / quarterly |
| `next_billing_date` | DateTime | Next charge date |
| `category` | String | streaming / software / fitness / news / gaming / other |
| `status` | Enum | active / paused / cancelled |
| `usage_score` | Number | AI-estimated 0-100 usage score |
| `ai_cancel_recommendation` | Boolean | AI flagged as worth cancelling |
| `last_known_amount` | Number | Previous charge amount (creep detection baseline) |

### ai_conversations

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `user_id` | ObjectId | Ref: users |
| `session_id` | String | Groups messages in one session |
| `mode` | Enum | text / voice / video |
| `messages` | Array | `[{role, content, timestamp, audio_url}]` |
| `context_snapshot` | Object | Financial snapshot at session start |
| `purchase_checks` | Array | `[{image_url, product, price, verdict, reasoning}]` |
| `started_at` | DateTime | Session start |
| `summary` | String | AI-generated conversation summary |

### notifications

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `user_id` | ObjectId | Ref: users |
| `type` | Enum | card_declined / limit_warning / subscription_renewal / budget_exceeded / price_creep / ai_tip |
| `title` | String | Short notification title |
| `message` | String | Full text |
| `is_read` | Boolean | Default: false |
| `related_entity_type` | String | virtual_card / subscription / transaction |
| `related_entity_id` | ObjectId | ID of related document |

---

## 9. API Design

### Authentication

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Create new user account |
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/me` | GET | Get current user profile |

### Dashboard

| Endpoint | Method | Description |
|---|---|---|
| `/api/dashboard/{user_id}` | GET | Full dashboard data in one call |
| `/api/transactions` | GET | Paginated transaction list with filters |
| `/api/spending/summary` | GET | Spending summary by category for a period |

### AI Advisor

| Endpoint | Method | Description |
|---|---|---|
| `/api/advisor/chat` | POST | Send text message to Vera, returns text + optional audio_url |
| `/api/advisor/purchase-check` | POST | Upload image for affordability check |
| `/api/advisor/conversations/{user_id}` | GET | Get conversation history |
| `/api/advisor/voice-session` | POST | Initialize ElevenLabs voice session, returns token |

### Virtual Cards

| Endpoint | Method | Description |
|---|---|---|
| `/api/cards/{user_id}` | GET | List all virtual cards with status and spending |
| `/api/cards` | POST | Create new virtual card via Stripe Issuing |
| `/api/cards/{card_id}/pause` | PATCH | Pause a card |
| `/api/cards/{card_id}` | DELETE | Destroy card permanently |
| `/api/cards/{card_id}/limit` | PATCH | Update spending limit |

### Anomaly Detection

| Endpoint | Method | Description |
|---|---|---|
| `/api/alerts/{user_id}` | GET | Get pending anomaly alerts |
| `/api/alerts/{alert_id}/action` | POST | Approve Once / Update Limit / Decline & Pause |

---

## 10. File Structure

```
clearview/
  frontend/                          (Next.js 15 app)
    app/
      layout.tsx
      page.tsx                       (main dashboard)
      cards/page.tsx                 (virtual card manager)
      advisor/page.tsx               (AI chat page)
    components/
      dashboard/NetWorthCard.tsx
      dashboard/SpendingChart.tsx
      dashboard/MonthlyTrendChart.tsx
      dashboard/BudgetProgressBar.tsx
      dashboard/SubscriptionGrid.tsx
      dashboard/TransactionFeed.tsx
      dashboard/QuickStats.tsx
      advisor/ChatPanel.tsx
      advisor/CameraCheck.tsx
      advisor/VoiceCallModal.tsx
      cards/VirtualCardGrid.tsx
      cards/CreateCardModal.tsx
      alerts/AnomalyAlert.tsx
  backend/                           (FastAPI app)
    main.py
    database.py                      (MongoDB Motor connection)
    seed_data.py                     (populate with mock data)
    routers/
      dashboard.py
      advisor.py
      cards.py
      voice.py
      alerts.py
```

---

## 11. Build Phases

### Phase 1 (Hours 1-2): Foundation

Backend foundation. `seed_data.py` populates MongoDB with realistic mock data for "Alex Chen": 60 transactions over 90 days, 4 accounts (checking $4,200 / savings $8,100 / credit -$1,400 / 401k $12,000), 8 subscriptions (Netflix $15.99, Spotify $9.99, gym $45, Adobe $54.99, iCloud $2.99, NYT $17, Amazon Prime $14.99, Hulu $17.99), financial profile (income $4,500/month, budget $3,200/month). FastAPI app with CORS. Dashboard endpoint returns all data in one response.

### Phase 2 (Hours 2-5): Dashboard UI

Next.js 15 dashboard with the full component set: NetWorthCard, SpendingDonut, MonthlyTrend, BudgetProgressBar, SubscriptionGrid, TransactionFeed, QuickStats. Dark theme, glassmorphism, animated charts. Must look like a real fintech product.

### Phase 3 (Hours 5-7): AI Advisor (Gemini)

Chat interface with Vera. Full financial context injection on every call. Quick-action chips. Conversation persistence in MongoDB. Right-side sliding panel.

### Phase 4 (Hours 7-9): Camera Purchase Check

"Can I Afford This?" feature. Gemini Vision extracts product + price. Advisor responds with context-aware verdict. Result card with YES/CAREFUL/NO badge.

### Phase 5 (Hours 9-11): Virtual Cards + Anomaly Detection

Stripe Issuing sandbox integration. Card CRUD operations. Kill-switch with dramatic destroy animation. Subscription creep detection: compare incoming charge vs `last_known_amount`, trigger alert if delta >5%. Alert UI with three action buttons.

### Phase 6 (Hours 11-12): Voice + Polish

ElevenLabs voice call with Vera. Full-screen modal with animated avatar. Loading skeletons, error states, smooth transitions. Run demo script 3 times.

### Bonus (If Time Allows): Solana Receipt NFTs

Mint SPL token on devnet per transaction. "On-chain Receipt" badge on transactions. Link to solscan.io explorer.

---

## 12. Success Metrics

| Metric | Target | How to Measure |
|---|---|---|
| Demo completion rate | 100% of features work live | Run demo 3x before presenting |
| Judge comprehension time | <10 seconds to understand value prop | Test with someone unfamiliar |
| Sponsor tech integrations | 5+ sponsors actively used | Count API calls in demo |
| UI polish | Indistinguishable from a real product | Side-by-side with Copilot.money |
| AI response accuracy | Zero generic responses — all cite user data | Test 10 questions pre-demo |
| Creep detection | Alert fires correctly on simulated price hike | Demo with seeded anomaly data |

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Real bank data requires Plaid approval (weeks) | Use mock data. Be upfront about it. Architecture supports real Plaid post-hackathon. |
| Stripe Issuing sandbox limitations | Sandbox is sufficient for demo. Real card issuance is a post-hackathon upgrade. |
| Camera/voice features crash during demo | Error handling is mandatory for these. Text fallback for voice if room is noisy. |
| Gemini gives generic advice | Test 10 questions before demo. Always inject full financial snapshot. Temperature 0.3. |
| Scope creep steals time from UI polish | A beautiful half-done product beats a complete ugly one. Follow phase order strictly. |
| Subscription creep detection false positives | Configurable threshold (default 5%). Show old/new amounts so user can judge. |

---

## 14. Out of Scope (V1)

- Real Plaid bank account linking (mock data only)
- Physical card issuance
- Multi-currency / international merchants
- Peer-to-peer payments
- Investment or savings automation
- Real Stripe transactions (sandbox only)
- Production Solana mainnet (devnet only)

---

## 15. Demo Script (60 Seconds)

**OPEN on dashboard:**
"This is Clearview — your personal finance OS. In one screen: $22,900 net worth, $340 discretionary budget left this month, and 8 subscriptions costing me $178 a month I probably don't all need."

**[Click AI chat panel]**
"Meet Vera, your AI financial advisor — but unlike every other AI, Vera knows every dollar I've spent."
[Type: "Should I go on a $800 trip to Miami next month?"]
"She didn't say 'make sure you save up' — she said I have $340 left and $267 in bills coming. That's a real answer."

**[Camera feature]**
[Show product image]
"I'm in a store. Can I afford these $120 shoes?"
[Wait 3 seconds]
"No. And she told me exactly why, using my actual balance."

**[Go to Cards page]**
"I've been paying for a gym I haven't been to in 4 months."
[Click Destroy on gym card]
"Done. They cannot charge me again. No phone call. No cancellation page. The money physically cannot leave my account."

**[Show anomaly alert]**
"And look — Netflix just tried to charge me $17.99 instead of $15.99. Clearview caught it before the money left. I can approve it, update my limit, or decline and freeze the card. My money, my rules."

**[Click Call Vera]**
"And if I want to go deeper — I call her."
[Speak: "Vera, am I being financially responsible?"]
[Let her answer]
"This is Clearview."

---

## 16. Anti-Patterns to Avoid

1. Do NOT integrate real Plaid — use mock data, be upfront about it.
2. Do NOT put API keys in the frontend — backend only.
3. Do NOT over-engineer Solana — it's a bonus.
4. Do NOT let scope creep steal time from UI polish.
5. Do NOT demo on mobile — use desktop where the dashboard shines.
6. Do NOT skip error handling for camera and voice — these are demo-critical.
7. Do NOT let Vera give generic advice — test 10 questions before demo.
