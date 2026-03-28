# Clearview -- Personal Finance OS

> **Every dollar, crystal clear.**

Clearview is a full-stack personal finance dashboard built for GrizzHacks 8. It combines an AI financial advisor, virtual card management, subscription creep detection, and voice interaction into a single, beautifully designed dark-mode interface.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [Demo Script](#demo-script)
- [Environment Variables](#environment-variables)

---

## Features

### F-001: Financial Dashboard
Full-screen dark fintech dashboard with animated charts, real-time data, and at-a-glance financial health. Includes net worth count-up animation, spending donut chart, monthly trend area chart, budget progress bars, subscription grid, transaction feed, and upcoming bills strip.

### F-002: AI Financial Advisor (Vera)
Chat interface powered by Gemini 1.5 Flash. Every response is grounded in the user's actual financial data -- zero generic advice. Full transaction history, balances, subscriptions, and budget data are injected as context on every API call.

### F-003: "Can I Afford This?" Camera
Photograph any product. Gemini Vision extracts the price. Vera gives a financial verdict (YES / HOLD OFF / NO) using your real discretionary budget, upcoming bills, and checking balance.

### F-004: Virtual Card Manager (Stripe Issuing)
Create merchant-locked virtual cards with hard spending limits. Pause cards temporarily or destroy them permanently with a dramatic animation. No phone calls, no cancellation portals -- one click and the merchant can never charge you again.

### F-005: Subscription Creep Detection
Automatically detects unannounced price increases by comparing incoming charges against the last known amount. Triggers a prominent alert banner with three action options: Approve Once, Update Limit, or Decline & Pause Card.

### F-006: Vera Voice Call (ElevenLabs)
Full-screen voice call interface with animated Vera avatar. Supports text-to-speech responses and real-time voice conversations via ElevenLabs Conversational AI.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 + TypeScript | App framework with server components |
| Styling | Tailwind CSS v4 | Utility-first CSS with custom design tokens |
| Charts | Recharts | Animated financial data visualization |
| Icons | Lucide React | Consistent SVG icon set |
| Backend | FastAPI (Python 3.11+) | Async REST API server |
| Database | MongoDB Atlas (Motor) | Document database with async driver |
| AI | Google Gemini 1.5 Flash | Text + Vision multimodal LLM |
| Voice | ElevenLabs Conversational AI | Text-to-speech and voice sessions |
| Cards | Stripe Issuing (sandbox) | Virtual card creation and management |
| Fonts | Syne, DM Sans, JetBrains Mono | Display, body, and monospace fonts |

---

## Architecture

```
Browser (Next.js 15)
    |
    |-- /dashboard      --> GET /api/dashboard/{user_id}
    |-- /advisor        --> POST /api/advisor/chat
    |                   --> POST /api/advisor/purchase-check
    |-- /cards          --> GET/POST/PATCH/DELETE /api/cards
    |-- Voice Call      --> POST /api/voice/session
    |-- Alerts          --> GET /api/alerts/{user_id}
    |                   --> POST /api/alerts/{alert_id}/action
    |
FastAPI Backend (port 8000)
    |
    |-- Gemini 1.5 Flash (AI advisor + vision)
    |-- ElevenLabs (TTS + voice sessions)
    |-- Stripe Issuing (virtual cards)
    |-- MongoDB Atlas (all data)
```

---

## Getting Started

### Prerequisites

- Python 3.11+ (`python --version`)
- Node.js 18+ (`node --version`)
- MongoDB Atlas account (free tier works)
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/samipdevkota10/GrizzHacks-8-.git
cd GrizzHacks-8-/clearview
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create `backend/.env` with your credentials:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=clearview_db
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_VERA_VOICE_ID=
STRIPE_SECRET_KEY=
STRIPE_CARDHOLDER_ID=
FRONTEND_URL=http://localhost:3000
```

Seed the database and start the server:

```bash
python seed_data.py
uvicorn main:app --reload --port 8000
```

The seed script will print the user ID -- copy it for the frontend.

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

Start the development server:

```bash
npm run dev
```

### 4. Connect Frontend to Seeded Data

Open http://localhost:3000 in Chrome. Open the browser console and set the demo user ID:

```javascript
localStorage.setItem("clearview_user_id", "<USER_ID_FROM_SEED_OUTPUT>");
```

Refresh the page. The dashboard should populate with Alex Chen's financial data.

---

## API Reference

### Health Check
```
GET /api/health
Response: { "status": "ok" }
```

### Dashboard
```
GET /api/dashboard/{user_id}
Response: Full dashboard payload (user, accounts, transactions, subscriptions,
          virtual cards, alerts, monthly summary, quick stats, net worth)
```

### AI Advisor
```
POST /api/advisor/chat
Body: { "user_id": string, "message": string, "conversation_id"?: string }
Response: { "response": string, "conversation_id": string }

POST /api/advisor/purchase-check
Body: multipart/form-data { image: File, user_id: string }
Response: { "product": string, "price": number, "verdict": string, "reasoning": string }

GET /api/advisor/conversations/{user_id}?limit=10
Response: { "conversations": [...] }
```

### Virtual Cards
```
GET    /api/cards/{user_id}
POST   /api/cards                          Body: { user_id, merchant_name, spending_limit_monthly, ... }
PATCH  /api/cards/{card_id}/pause          (toggles pause/resume)
DELETE /api/cards/{card_id}                (permanent destroy)
PATCH  /api/cards/{card_id}/limit          Body: { spending_limit_monthly: number }
```

### Anomaly Alerts
```
GET  /api/alerts/{user_id}
POST /api/alerts/{alert_id}/action
     Body: { "action": "approve_once" | "approve_update_limit" | "decline_pause" }
```

### Voice
```
POST   /api/voice/tts                      Body: { "text": string, "user_id": string }
POST   /api/voice/session                  Body: { "user_id": string, "mode": "voice" }
DELETE /api/voice/session/{session_token}
```

---

## Project Structure

```
clearview/
  backend/
    config.py                    Pydantic Settings (env vars)
    database.py                  Motor async MongoDB connection
    main.py                      FastAPI app + CORS + router loading
    seed_data.py                 Full mock data seeder (Alex Chen)
    requirements.txt             Python dependencies
    models/
      user.py                    User + FinancialProfile models
      transaction.py             Transaction model
      virtual_card.py            VirtualCard model
      subscription.py            Subscription model
      anomaly_alert.py           AnomalyAlert model
      account.py                 Account model
      conversation.py            AIConversation + Message models
      notification.py            Notification model
    routers/
      dashboard.py               GET /api/dashboard/{user_id}
      advisor.py                 Chat + purchase-check + conversations
      cards.py                   Virtual card CRUD
      alerts.py                  Anomaly alert actions
      voice.py                   TTS + voice session management
    services/
      gemini_service.py          Gemini 1.5 Flash integration
      financial_context.py       Builds financial snapshot for AI
      stripe_service.py          Stripe Issuing (mock fallback)
      creep_detection.py         Price increase detection logic
      elevenlabs_service.py      ElevenLabs TTS + signed URLs

  frontend/
    app/
      layout.tsx                 Root layout (fonts, CSS vars)
      page.tsx                   Redirect to /dashboard
      globals.css                Design system + animations
      dashboard/page.tsx         Main dashboard page
      cards/page.tsx             Virtual card manager
      advisor/page.tsx           Full AI advisor chat page
    components/
      layout/                    Sidebar, TopBar, DashboardLayout, AIPanelWrapper
      dashboard/                 NetWorthCard, SpendingDonut, MonthlyTrendChart,
                                 BudgetProgress, SubscriptionGrid, TransactionFeed,
                                 QuickStats, UpcomingBills
      alerts/                    AnomalyAlert (creep detection banner)
      advisor/                   ChatPanel, ChatMessage, QuickChips, TypingIndicator,
                                 CameraModal, PurchaseResult
      cards/                     VirtualCard, VirtualCardGrid, CreateCardModal,
                                 CardDestroyConfirm
      vera/                      VeraAvatar, VoiceCallModal, VoiceWaveform, VeraCallButton
      shared/                    LoadingSkeleton, CurrencyDisplay, TrendArrow, MerchantLogo
    hooks/
      useDashboard.ts            Dashboard data fetching
      useAlerts.ts               Alert action handling
      useAdvisor.ts              Chat state + message sending
      useCamera.ts               Image upload + purchase analysis
      useVirtualCards.ts         Card CRUD operations
      useVera.ts                 Voice call state management
    lib/
      api.ts                     API client functions
      types.ts                   TypeScript interfaces
      formatters.ts              Currency/date formatting + cn()
      constants.ts               Colors, labels, gradients
```

---

## Design System

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#070B14` | Page background |
| `bg-secondary` | `#0D1526` | Card backgrounds |
| `bg-tertiary` | `#141F35` | Hover / elevated states |
| `accent-blue` | `#4F8EF7` | Primary actions |
| `positive` | `#00D26A` | Income, positive values |
| `negative` | `#FF4757` | Expenses, alerts |
| `warning` | `#FFB836` | Budget warnings |
| `vera-primary` | `#A78BFA` | Vera's brand color |

### Typography
| Font | Variable | Usage |
|------|----------|-------|
| Syne | `--font-display` | Numbers, headings, the Clearview wordmark |
| DM Sans | `--font-body` | All body text, labels, descriptions |
| JetBrains Mono | `--font-mono` | Card numbers, transaction IDs |

### Component Patterns
- Glass cards: `bg-[rgba(13,21,38,0.8)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.06)] rounded-2xl`
- All charts animate on mount (600ms ease-in)
- Card destroy: shake (300ms) -> red flash (100ms) -> shrink (400ms)
- Alert slide-out: 400ms upward fade after action

---

## Demo Script (90 Seconds)

**[Dashboard -- 0:00-0:15]**
"This is Clearview. One screen. Everything you need to know about your money -- $23,400 net worth, $340 discretionary left this month, 8 subscriptions costing $178 a month."

**[Anomaly Alert -- 0:15-0:30]**
"And look -- Netflix just tried to charge $17.99 instead of $15.99. A 12.5% price hike, caught before the money left my account. I can approve it, update my limit, or decline and freeze the card."

**[AI Advisor -- 0:30-0:50]**
Type: "Should I book a $600 trip to Miami next month?"
"She didn't say 'make sure you budget carefully.' She said I have $340 left and $267 in bills coming. That's a real answer."

**[Camera -- 0:50-1:05]**
Upload a shoe photo.
"I'm in a store. Can I afford these $120 Nike shoes? No -- and she told me exactly why."

**[Cards -- 1:05-1:20]**
Navigate to /cards. Click Destroy on Planet Fitness.
"Four months of gym payments I forgot about. Done. They cannot charge me again."

**[Vera Call -- 1:20-1:35]**
Click Call Vera. "Vera, am I being financially responsible this month?"

---

## Environment Variables

### Backend (`clearview/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | No | Database name (default: `clearview_db`) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | Model name (default: `gemini-1.5-flash`) |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API key (voice features) |
| `ELEVENLABS_AGENT_ID` | No | ElevenLabs Conversational AI agent ID |
| `ELEVENLABS_VERA_VOICE_ID` | No | Voice ID for Vera's TTS |
| `STRIPE_SECRET_KEY` | No | Stripe test key (card features, mock fallback) |
| `STRIPE_CARDHOLDER_ID` | No | Stripe cardholder for issuing |
| `FRONTEND_URL` | No | Frontend URL for CORS (default: `http://localhost:3000`) |

### Frontend (`clearview/frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (default: `http://localhost:8000`) |
