# Vera Fund — Integration & Demo Readiness Plan

> **Current date:** March 28, 2026
> **Status:** Frontend complete (mock data), Backend complete (not connected), No working demo flow

---

## 1. Situation Assessment

### What We Have

| Layer | Status | Details |
|-------|--------|---------|
| **Landing Page** | Done | 11 animated sections, Vera Fund branding, warm light theme |
| **Auth Page** | Done | Login/signup with social buttons, routes to onboarding or dashboard |
| **Onboarding** | Done (UI only) | 4-step wizard: goals, cards, Plaid, loans — no backend save |
| **Dashboard** | Done (mock data) | 7 tabs: overview, transactions, cards, analyzer, goals, advisor, bills |
| **Terms/Privacy** | Done | Full legal pages, Vera Fund branding |
| **Backend API** | Done (untested) | FastAPI with 5 routers: dashboard, advisor, cards, alerts, voice |
| **Database** | Blocked | MongoDB Atlas blocked by college network (port 27017); local MongoDB available via Docker |
| **AI (Gemini)** | Backend ready | `gemini_service.py` exists with chat + vision; frontend not wired |
| **Voice (ElevenLabs)** | Backend ready | `elevenlabs_service.py` exists; frontend not wired |
| **Cards (Stripe)** | Backend ready | `stripe_service.py` with mock fallback; frontend not wired |

### The Core Gap

The frontend and backend are **completely disconnected**. The frontend renders beautiful UI with hardcoded mock data from `lib/mock-data.ts`. The backend serves real data from MongoDB. There are **no hooks, no API client, no fetch calls** connecting them. The old integration layer (6 hooks + api.ts) was deleted during the UI overhaul.

### Environment Mismatches

| Issue | Current Value | Should Be |
|-------|--------------|-----------|
| Frontend API port | `http://localhost:8001` (.env.local) | `http://localhost:8000` (backend default) |
| Backend .env MONGODB_URI | `mongodb://localhost:27017/clearview_db` | Atlas URI or local Docker MongoDB |
| Backend brand references | "Clearview" in seed data, system prompts | Should be "Vera Fund" |
| User ID in .env.local | `69c84530e555b3648a0b31e7` | Must match actual seeded user ObjectId |

---

## 2. Decision: Database Strategy

You have two options. **Pick one before doing anything else.**

### Option A: Local MongoDB via Docker (Recommended for hackathon)

**Pros:** Works on any network, no Atlas dependency, instant setup
**Cons:** Data doesn't persist across machines

```powershell
# You already have LOCAL_MONGO_SETUP.md — follow it:
docker run -d --name clearview-mongo -p 27017:27017 mongo:7
```

Backend `.env` stays as `mongodb://localhost:27017/clearview_db` — already correct.

### Option B: MongoDB Atlas via Phone Hotspot

**Pros:** Data persists, shareable
**Cons:** Need hotspot every time you demo, unreliable

```
1. Connect laptop to phone hotspot
2. Update Atlas Network Access → Allow from Anywhere (0.0.0.0/0)
3. Change backend .env to Atlas URI
4. Run seed_data.py
```

### Recommendation

**Use Option A (Docker) for development. Switch to Atlas for the actual demo if you'll have hotspot/good internet.**

---

## 3. Step-by-Step Execution Plan

### Phase 0: Environment Fix (15 min) — YOU do this

These are manual steps that require your machine/accounts:

- [ ] **Start MongoDB** — `docker run -d --name clearview-mongo -p 27017:27017 mongo:7` (or start existing container)
- [ ] **Fix frontend .env.local** — change port from 8001 to 8000:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```
- [ ] **Verify backend .env** — confirm `MONGODB_URI=mongodb://localhost:27017/clearview_db` and `GEMINI_API_KEY` is set
- [ ] **Run seed** — `cd clearview/backend; python seed_data.py` — note the printed user ID
- [ ] **Update frontend .env.local** — put the real user ID in `NEXT_PUBLIC_CLEARVIEW_USER_ID`
- [ ] **Start backend** — `uvicorn main:app --reload --port 8000`
- [ ] **Start frontend** — `cd clearview/frontend; npm run dev`
- [ ] **Verify** — `http://localhost:8000/api/health` returns `{"status":"ok"}`

### Phase 1: Frontend-Backend Integration (AI does this — ~2 hours)

This is the critical work. Create the API client and hooks that connect the frontend to the real backend.

**Files to create:**
1. `lib/api.ts` — Centralized fetch client for all backend endpoints
2. `hooks/useDashboard.ts` — Fetch dashboard data, replace mock imports on overview page
3. `hooks/useAdvisor.ts` — Send messages to Gemini via backend, receive AI responses
4. `hooks/useCards.ts` — CRUD operations for virtual cards via backend
5. `hooks/useAlerts.ts` — Fetch anomaly alerts, handle approve/decline/update actions

**Files to modify:**
1. `app/dashboard/page.tsx` — Replace mock data imports with `useDashboard()` hook
2. `app/dashboard/advisor/page.tsx` — Replace mock AI responses with real Gemini calls
3. `app/dashboard/analyzer/page.tsx` — Replace mock analysis with real Gemini Vision call
4. `app/dashboard/cards/page.tsx` — Replace mock cards with real Stripe data
5. `app/dashboard/transactions/page.tsx` — Fetch from API instead of mock
6. `app/dashboard/bills/page.tsx` — Fetch subscriptions from API

**Strategy:** Keep `mock-data.ts` as fallback. Each hook tries the API first; if it fails (backend down), falls back to mock data. This way the UI always works for demo even if backend hiccups.

### Phase 2: Update Backend for Vera Fund (AI does this — ~30 min)

1. Update `seed_data.py` — Change "Alex Chen" → "Alex Morgan", email to `@verafund.app`
2. Update `services/gemini_service.py` — Change system prompt from "Clearview" to "Vera Fund"
3. Update `services/financial_context.py` — Change any "Clearview" references
4. Re-run `seed_data.py` after changes

### Phase 3: Anomaly Alert on Dashboard (AI does this — ~30 min)

The PRD's "strongest demo moment" — Netflix price creep alert. The backend already seeds a pending Netflix anomaly alert. We need:

1. Add an alert banner component to the dashboard overview
2. Wire it to `GET /api/alerts/{user_id}`
3. Show: Netflix logo, $15.99 → $17.99, +12.5% badge
4. Three action buttons: Approve Once / Update Limit / Decline & Pause
5. Each button calls `POST /api/alerts/{alert_id}/action`

### Phase 4: Real AI Advisor (AI does this — ~30 min)

Replace the mock Vera chat with real Gemini calls:

1. Frontend sends user message to `POST /api/advisor/chat`
2. Backend injects full financial context into Gemini prompt
3. Gemini responds with dollar-specific advice
4. Response displayed in chat bubble

### Phase 5: Real Purchase Analyzer (AI does this — ~30 min)

Replace the mock analysis with real Gemini Vision:

1. User uploads photo via drag-and-drop (already works)
2. Photo sent to `POST /api/advisor/purchase-check` as multipart form
3. Gemini Vision extracts product + price
4. Vera calculates affordability with real financial data
5. Results displayed in the existing UI

### Phase 6: Polish & Demo Prep (AI does this — ~1 hour)

1. Loading skeletons while data fetches
2. Error states when backend is down (show mock data with "Demo Mode" badge)
3. Ensure all charts animate on mount
4. Fix any visual glitches after real data integration
5. Update onboarding to save goals/cards/loans to MongoDB (or at minimum, localStorage)

---

## 4. What YOU Must Do (Manual Steps Only You Can Do)

| # | Task | Time | Why Only You |
|---|------|------|--------------|
| 1 | Start Docker MongoDB (or use hotspot for Atlas) | 5 min | Requires Docker/network access |
| 2 | Run `python seed_data.py` and note the user ID | 2 min | Requires running terminal |
| 3 | Start backend: `uvicorn main:app --reload --port 8000` | 1 min | Requires running terminal |
| 4 | Start frontend: `npm run dev` | 1 min | Requires running terminal |
| 5 | Test full demo flow in browser | 10 min | Visual verification |
| 6 | Set up ElevenLabs account + create Vera voice agent (optional) | 30 min | Requires account creation |
| 7 | Set up Stripe test account (optional) | 15 min | Requires account creation |
| 8 | Practice the 90-second demo script 3 times | 15 min | Only you present |

---

## 5. What AI Does (Tell Me To Do These)

| # | Task | Estimated Time | Dependencies |
|---|------|---------------|-------------|
| 1 | Create `lib/api.ts` + all hooks | 45 min | Phase 0 complete |
| 2 | Wire dashboard overview to real API | 30 min | #1 |
| 3 | Wire AI advisor to Gemini backend | 20 min | #1 |
| 4 | Wire purchase analyzer to Gemini Vision | 20 min | #1 |
| 5 | Add anomaly alert banner to dashboard | 20 min | #1 |
| 6 | Wire cards page to Stripe backend | 15 min | #1 |
| 7 | Update backend seed data + prompts for Vera Fund | 15 min | None |
| 8 | Polish: loading states, error fallbacks, animations | 30 min | #2-6 |
| 9 | Build and verify zero errors | 10 min | All above |

**Total AI work: ~3.5 hours**

---

## 6. Demo Script (Updated for Vera Fund)

### Setup Before Judges Arrive
- Docker MongoDB running
- Backend running on port 8000
- Frontend running on port 3000
- Dashboard open at 1440px
- Netflix anomaly alert visible at top

### The 90-Second Script

**[Landing Page — 0:00-0:10]**
"This is Vera Fund. One place for all your finances."
[Click "Get Started"]

**[Auth — 0:10-0:15]**
[Quick signup, redirects to onboarding]

**[Onboarding — 0:15-0:25]**
"First time? Tell us your goals, add your cards, connect your bank via Plaid."
[Click through steps quickly → Launch Dashboard]

**[Dashboard — 0:25-0:40]**
"Everything you need to know about your money — $47,820 net worth, spending trends, budget progress, all in one view."

**[Anomaly Alert — 0:40-0:50]**
"And look — Netflix just tried to charge $17.99 instead of $15.99. A 12.5% price hike caught before the money left. I can approve, update my limit, or decline and freeze the card instantly."
[Click Decline & Pause]

**[Purchase Analyzer — 0:50-1:05]**
"Want to buy something? Upload a photo."
[Upload shoe photo]
"It tells me exactly how many hours of my life this costs — based on my real income and taxes. 11 hours of work for headphones. That's a real perspective."

**[AI Advisor — 1:05-1:20]**
[Type: "Should I book a $600 trip to Miami next month?"]
"Vera doesn't give generic advice. She knows I have $380 left in my budget and $1,450 rent due April 1st. That's a real answer with my real numbers."

**[Cards — 1:20-1:30]**
"And if I want to cancel a subscription? One click. No phone call. No cancellation portal."
[Freeze a card]

**[Close — 1:30-1:35]**
"This is Vera Fund. Your all-in-one financial advisor."

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| MongoDB down during demo | Mock data fallback built into every hook |
| Gemini API slow or down | Pre-cache one response; show typing indicator longer |
| College network blocks MongoDB | Use Docker local MongoDB |
| Network blocks Clearbit logos | Lucide icon fallback in MerchantLogo component (already implemented) |
| Backend crashes mid-demo | Frontend degrades gracefully to mock data |
| Onboarding doesn't save | Acceptable for MVP — mention "Plaid sandbox" |

---

## 8. Recommended Execution Order

```
RIGHT NOW:
  1. You: Start Docker MongoDB + seed data + start backend
  2. You: Fix frontend .env.local (port 8000, correct user ID)
  3. You: Start frontend, verify landing page works

THEN TELL AI:
  4. "Wire the frontend to the backend API" (Phase 1-5)
  5. "Polish and build verify" (Phase 6)

BEFORE DEMO:
  6. You: Practice demo script 3x
  7. You: Verify anomaly alert, advisor, and analyzer all work
```

---

## 9. Files That Will Change

### New Files (AI creates)
- `clearview/frontend/lib/api.ts`
- `clearview/frontend/hooks/useDashboard.ts`
- `clearview/frontend/hooks/useAdvisor.ts`
- `clearview/frontend/hooks/useCards.ts`
- `clearview/frontend/hooks/useAlerts.ts`

### Modified Files (AI updates)
- `clearview/frontend/app/dashboard/page.tsx` — API integration
- `clearview/frontend/app/dashboard/advisor/page.tsx` — Real Gemini calls
- `clearview/frontend/app/dashboard/analyzer/page.tsx` — Real Gemini Vision
- `clearview/frontend/app/dashboard/cards/page.tsx` — Real Stripe data
- `clearview/frontend/app/dashboard/transactions/page.tsx` — API data
- `clearview/frontend/app/dashboard/bills/page.tsx` — API data
- `clearview/backend/seed_data.py` — Vera Fund branding
- `clearview/backend/services/gemini_service.py` — Vera Fund in prompts

### Untouched (Already good)
- All landing page components
- Auth page
- Onboarding page (UI complete, backend save is nice-to-have)
- Terms & Privacy pages
- Dashboard layout + sidebar
- MerchantLogo component
- globals.css, layout.tsx

---

## 10. Post-Hackathon (If You Want to Keep Building)

1. Real Plaid integration (production API keys)
2. Real Stripe Issuing (not sandbox)
3. User authentication with NextAuth.js / Clerk
4. Multi-user support
5. Mobile app (React Native)
6. Solana NFT receipts for transactions
7. ElevenLabs voice calls with Vera
8. Deploy: Vercel (frontend) + Railway (backend) + Atlas (database)
