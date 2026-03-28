# Vera Fund — Your All-in-One Financial Advisor

> **Smart money management for everyone.**

Vera Fund is a full-stack personal finance platform built for GrizzHacks 8. It combines AI-powered financial advice, spending analytics, purchase affordability analysis, virtual card management, and goal tracking into a single, polished interface designed to feel like a real product.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [User Flow](#user-flow)
- [Environment Variables](#environment-variables)

---

## Features

### Landing Page
Marketing-grade landing page with animated sections: hero, feature highlights, how it works, integration partners, pricing tiers, testimonials, and blog. Smooth scroll-triggered animations powered by Framer Motion.

### Authentication
Login and signup with email/password or social providers (Google, Apple). Animated form transitions between login and signup modes. Links to Terms & Conditions and Privacy Policy.

### Multi-Step Onboarding
Chase-inspired onboarding wizard with four steps:
1. **Financial Goals** — select from emergency fund, investing, debt payoff, budgeting, retirement
2. **Cards** — add credit and debit cards with card name, last 4 digits, and type
3. **Bank Connection** — connect accounts via Plaid (sandbox mode, no real bank data accessed)
4. **Loans & Mortgages** — declare outstanding debts with balance, APR, and monthly payment

### Dashboard Overview
Bloomberg/Tableau-inspired financial dashboard with data-dense cards:
- **Quick Stats** — net worth, monthly income, spending, and savings rate with trend indicators
- **Income vs Spending Chart** — 6-month area chart comparing income and expenditures
- **Spending Breakdown** — donut chart with category-level detail
- **Budget Progress** — per-category progress bars with over-budget warnings
- **Recent Transactions** — live feed with real merchant logos (via Clearbit)
- **Financial Goals** — progress tracking toward savings targets
- **Upcoming Bills** — due dates and autopay status

### Purchase Analyzer
Upload a photo of something you want to buy. The AI analyzes:
- Whether you can afford it based on remaining budget
- How many **hours of your work** it costs (based on your after-tax hourly rate)
- Percentage impact on monthly income
- Detailed financial breakdown with recommendation

### Cards Management
Visual card interface showing credit and debit cards with:
- Card number reveal/hide toggle
- Freeze/unfreeze capability
- Credit utilization bars with color-coded status

### AI Advisor (Vera)
Chat interface with Vera, the AI financial advisor powered by Gemini 1.5 Flash. Every response is grounded in the user's actual financial data. Includes suggested question chips and a typing indicator.

### Goals & Debt Tracking
Progress visualization for financial goals (emergency fund, vacation, debt payoff) plus loan tracking with payoff percentages and monthly payment details.

### Bills & Subscriptions
Comprehensive view of recurring payments: upcoming bills with autopay status, and active subscriptions with real brand logos.

### Legal Pages
Full Terms & Conditions (11 sections) and Privacy Policy (10 sections) covering data handling, AI disclaimer, third-party integrations, and user rights.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 + React 19 + TypeScript | App framework with app router |
| Styling | Tailwind CSS v4 | Utility-first CSS with custom design tokens |
| Charts | Recharts | Area charts, pie charts, progress bars |
| Animations | Framer Motion (`motion`) | Scroll-triggered, staggered entry, hover effects |
| File Upload | react-dropzone | Drag & drop image upload for Purchase Analyzer |
| Icons | Lucide React | Consistent SVG icon set |
| Logos | Clearbit Logo API | Real merchant/brand logos in transactions |
| Backend | FastAPI (Python 3.11+) | Async REST API server |
| Database | MongoDB (Atlas or local) | Document database with async driver (Motor) |
| AI | Google Gemini 1.5 Flash | Text + Vision multimodal LLM |
| Voice | ElevenLabs Conversational AI | Text-to-speech and voice sessions |
| Cards API | Stripe Issuing (sandbox) | Virtual card creation and management |
| Fonts | Inter, Playfair Display, JetBrains Mono | Body, display, and monospace fonts |

---

## Architecture

```
Browser (Next.js 15)
    |
    |-- /                   Landing page (marketing)
    |-- /auth               Login / Signup
    |-- /onboarding         4-step onboarding wizard
    |-- /dashboard          Financial overview (sidebar layout)
    |   |-- /transactions   Full transaction history with filters
    |   |-- /cards          Credit & debit card management
    |   |-- /analyzer       Purchase photo upload → AI analysis
    |   |-- /goals          Financial goals + loan tracking
    |   |-- /advisor        AI chat with Vera
    |   |-- /bills          Bills & subscription tracking
    |-- /terms              Terms & Conditions
    |-- /privacy            Privacy Policy
    |
FastAPI Backend (port 8000)
    |
    |-- Gemini 1.5 Flash (AI advisor + vision analysis)
    |-- ElevenLabs (TTS + voice sessions)
    |-- Stripe Issuing (virtual cards)
    |-- MongoDB (all persistent data)
```

---

## Getting Started

### Prerequisites

- Python 3.11+ (`python --version`)
- Node.js 18+ (`node --version`)
- MongoDB Atlas account (free tier) or local MongoDB
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

Create `backend/.env` (see `.env.example`):

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=clearview_db
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
```

Seed the database and start the server:

```bash
python seed_data.py
uvicorn main:app --reload --port 8000
```

For local MongoDB setup, see [LOCAL_MONGO_SETUP.md](../LOCAL_MONGO_SETUP.md).

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

Open http://localhost:3000. Click **Get Started** to begin the onboarding flow, or **Log In** to go directly to the dashboard.

---

## API Reference

### Health Check
```
GET /api/health → { "status": "ok" }
```

### Dashboard
```
GET /api/dashboard/{user_id} → Full financial payload
```

### AI Advisor
```
POST /api/advisor/chat
Body: { "user_id": string, "message": string, "conversation_id"?: string }

POST /api/advisor/purchase-check
Body: multipart/form-data { image: File, user_id: string }

GET /api/advisor/conversations/{user_id}?limit=10
```

### Virtual Cards
```
GET    /api/cards/{user_id}
POST   /api/cards              Body: { user_id, merchant_name, spending_limit_monthly }
PATCH  /api/cards/{card_id}/pause
DELETE /api/cards/{card_id}
PATCH  /api/cards/{card_id}/limit  Body: { spending_limit_monthly: number }
```

### Anomaly Alerts
```
GET  /api/alerts/{user_id}
POST /api/alerts/{alert_id}/action
     Body: { "action": "approve_once" | "approve_update_limit" | "decline_pause" }
```

---

## Project Structure

```
clearview/
  backend/
    main.py                      FastAPI app entry point
    config.py                    Pydantic settings (env vars)
    database.py                  MongoDB async connection (Motor)
    seed_data.py                 Demo data seeder
    diagnose_mongo.py            Atlas connectivity checker
    models/
      user.py                    User + FinancialProfile
      transaction.py             Transaction model
      virtual_card.py            VirtualCard model
      subscription.py            Subscription model
      anomaly_alert.py           AnomalyAlert model
      account.py                 Account model
      conversation.py            AIConversation + Message
    routers/
      dashboard.py               GET /api/dashboard/{user_id}
      advisor.py                 AI chat + purchase analysis
      cards.py                   Virtual card CRUD
      alerts.py                  Anomaly alert actions
      voice.py                   TTS + voice session management
    services/
      gemini_service.py          Gemini 1.5 Flash integration
      financial_context.py       Financial snapshot builder for AI
      stripe_service.py          Stripe Issuing (mock fallback)
      creep_detection.py         Subscription price hike detection
      elevenlabs_service.py      ElevenLabs TTS

  frontend/
    app/
      layout.tsx                 Root layout (fonts, metadata)
      page.tsx                   Landing page
      globals.css                Design tokens, animations, utilities
      auth/page.tsx              Login / Signup
      onboarding/page.tsx        4-step onboarding wizard
      dashboard/
        layout.tsx               Sidebar + top bar layout
        page.tsx                 Overview (charts, stats, transactions)
        transactions/page.tsx    Searchable transaction table
        cards/page.tsx           Card management
        analyzer/page.tsx        Purchase photo analyzer
        goals/page.tsx           Financial goals + debt tracking
        advisor/page.tsx         AI chat with Vera
        bills/page.tsx           Bills & subscriptions
      terms/page.tsx             Terms & Conditions
      privacy/page.tsx           Privacy Policy
    components/
      MerchantLogo.tsx           Merchant logo fetcher (Clearbit API)
      landing/
        Navbar.tsx               Top navigation with auth links
        HeroSection.tsx          Hero banner with CTA
        LogoMarquee.tsx          Partner logo carousel
        FeaturesSection.tsx      Feature highlights grid
        HowItWorks.tsx           Step-by-step explainer
        IntegrationSection.tsx   Integration partner showcase
        PricingSection.tsx       Pricing tier cards
        TestimonialsSection.tsx  User testimonials carousel
        BlogSection.tsx          Blog post previews
        CTASection.tsx           Final call-to-action
        Footer.tsx               Footer with legal links
    lib/
      mock-data.ts               Centralized financial mock data
      utils.ts                   cn() utility (clsx + tailwind-merge)
```

---

## Design System

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#FBF9F6` | Page background (warm cream) |
| `foreground` | `#1A1A1A` | Primary text |
| `card` | `#FFFFFF` | Card surfaces |
| `primary` | `#E53E0B` | Buttons, active states, accents |
| `muted` | `#F5F0EB` | Subtle backgrounds |
| `border` | `#E8E4E0` | Card and input borders |
| `green-600` | `#16A34A` | Positive values, income |
| `red-500` | `#DC2626` | Negative values, over-budget |

### Typography
| Font | Variable | Usage |
|------|----------|-------|
| Inter | `--font-sans` | All body text, labels, data |
| Playfair Display | `--font-serif-display` | Display headings (italic) |
| JetBrains Mono | `--font-mono` | Card numbers, code |

### Component Patterns
- Cards: `rounded-2xl bg-card border border-border` with `p-5`
- Buttons: `rounded-full bg-primary text-primary-foreground` with hover opacity
- Inputs: `rounded-xl bg-background border border-border` with focus ring
- Sidebar nav: active state uses `bg-primary text-primary-foreground`
- Animations: scroll-triggered via `useInView`, staggered children

---

## User Flow

```
Landing Page  →  Get Started  →  /auth (signup)
                                    ↓
                               /onboarding
                            Step 1: Goals
                            Step 2: Cards
                            Step 3: Bank (Plaid sandbox)
                            Step 4: Loans
                                    ↓
                              /dashboard (overview)
                               ├── Transactions
                               ├── Cards
                               ├── Purchase Analyzer
                               ├── Goals
                               ├── AI Advisor (Vera)
                               └── Bills & Subs
```

---

## Environment Variables

### Backend (`clearview/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_DB_NAME` | No | Database name (default: `clearview_db`) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | Model name (default: `gemini-1.5-flash`) |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API key (voice features) |
| `ELEVENLABS_AGENT_ID` | No | ElevenLabs agent ID |
| `ELEVENLABS_VERA_VOICE_ID` | No | Voice ID for Vera TTS |
| `STRIPE_SECRET_KEY` | No | Stripe test key (virtual cards) |
| `STRIPE_CARDHOLDER_ID` | No | Stripe cardholder for issuing |
| `FRONTEND_URL` | No | Frontend URL for CORS (default: `http://localhost:3000`) |

### Frontend (`clearview/frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (default: `http://localhost:8000`) |
