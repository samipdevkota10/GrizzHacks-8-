# Clearview -- Next Steps & Setup Guide

This document covers everything you need to do to get Clearview fully running, plus all the enhancements that can be made after the core build.

---

## Part 1: Things YOU Must Do (Manual / Requires Your Accounts)

These are tasks that require your personal credentials, account access, or manual actions that an AI agent cannot perform.

### 1.1 MongoDB Atlas Setup (REQUIRED)

**Priority: CRITICAL -- nothing works without this.**

1. Go to https://www.mongodb.com/cloud/atlas and create a free account
2. Create a new cluster (free M0 tier is fine)
3. Under "Database Access", create a database user with read/write permissions
4. Under "Network Access", add `0.0.0.0/0` (allow from anywhere) for development
5. Click "Connect" on your cluster, choose "Drivers", copy the connection string
6. The connection string looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
7. Paste it into `clearview/backend/.env` as `MONGODB_URI`

**Then seed the database:**
```bash
cd clearview/backend
pip install -r requirements.txt
python seed_data.py
```

The script will print something like:
```
Seeded: 1 users, 4 accounts, 8 cards, 8 subscriptions, 72 transactions, 1 alerts
```

**IMPORTANT:** Note the user ID that gets printed. You will need to set it in the browser:
```javascript
localStorage.setItem("clearview_user_id", "THE_OBJECT_ID_HERE");
```

To find the user ID if you missed it:
```bash
python -c "
import asyncio
from database import get_database
async def show():
    db = get_database()
    user = await db.users.find_one({'email': 'alex@clearviewdemo.com'})
    print(f'User ID: {user[\"_id\"]}')
asyncio.run(show())
"
```

### 1.2 Google Gemini API Key (REQUIRED for AI features)

**Priority: CRITICAL -- the AI advisor and camera feature need this.**

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste it into `clearview/backend/.env` as `GEMINI_API_KEY`

**Free tier limits:** 60 requests/minute, 1500 requests/day. More than enough for a hackathon demo.

**To test it works:**
```bash
curl -X POST http://localhost:8000/api/advisor/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id": "YOUR_USER_ID", "message": "How am I doing financially?"}'
```

### 1.3 ElevenLabs Setup (OPTIONAL -- for voice features)

**Priority: NICE TO HAVE -- voice features fall back to mock mode without this.**

1. Go to https://elevenlabs.io and create a free account
2. Go to Settings > API Keys, copy your API key
3. For Vera's voice:
   - Go to Voice Lab > Voice Library
   - Pick a professional, warm female voice (or clone your own)
   - Copy the Voice ID from the voice's settings
4. For Conversational AI (real-time voice calls):
   - Go to Conversational AI > Create Agent
   - Configure the agent with Vera's personality
   - Copy the Agent ID
5. Add all three values to `clearview/backend/.env`:
   ```
   ELEVENLABS_API_KEY=your-key
   ELEVENLABS_VERA_VOICE_ID=voice-id
   ELEVENLABS_AGENT_ID=agent-id
   ```

**Without ElevenLabs:** Voice calls work in mock mode with simulated responses. The chat/text advisor works fully via Gemini regardless.

### 1.4 Stripe Setup (OPTIONAL -- for real card operations)

**Priority: NICE TO HAVE -- card operations use mock data without Stripe configured.**

1. Go to https://dashboard.stripe.com and create an account
2. Toggle to "Test Mode" (top-right switch)
3. Go to Developers > API Keys, copy the Secret key (`sk_test_...`)
4. For Stripe Issuing:
   - Apply for Stripe Issuing sandbox access at https://dashboard.stripe.com/issuing
   - Once approved, create a Cardholder in the dashboard
   - Copy the Cardholder ID (`ich_...`)
5. Add to `clearview/backend/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_CARDHOLDER_ID=ich_...
   ```

**Without Stripe:** Card create/pause/destroy operations all work with mock data. The UI and animations function identically. Only the actual Stripe API calls are skipped.

### 1.5 Deployment (OPTIONAL -- for sharing/demo)

#### Frontend on Vercel
1. Push code to GitHub (done below)
2. Go to https://vercel.com, import the repo
3. Set root directory to `clearview/frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app`
5. Deploy

#### Backend on Railway
1. Go to https://railway.app, connect GitHub
2. Import the repo, set root directory to `clearview/backend`
3. Add all environment variables from `.env`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Deploy

---

## Part 2: Things the AI Agent Can Do Next (Code Improvements)

These are enhancements I can implement in follow-up sessions. Ask for any of these.

### 2.1 High Priority (Before Demo)

#### Fix: Print user_id after seeding
The seed script should print the exact user ID at the end for easy copy-paste.
- **Files:** `clearview/backend/seed_data.py`
- **Effort:** 2 minutes

#### Fix: Add seed verification script
Create `clearview/backend/verify_seed.py` that checks all collections have the right data and the Netflix anomaly alert exists.
- **Files:** New file
- **Effort:** 5 minutes

#### Enhancement: Monthly trend chart from real data
Currently uses hardcoded `MOCK_MONTHLY_DATA`. The backend should aggregate 6 months of transaction data and return it in the dashboard payload.
- **Files:** `clearview/backend/routers/dashboard.py`, `clearview/frontend/app/dashboard/page.tsx`
- **Effort:** 15 minutes

#### Enhancement: Subscription logos
Add real SVG logos for Netflix, Spotify, Planet Fitness, etc. using Simple Icons CDN.
- **Files:** Multiple subscription/card components
- **Effort:** 15 minutes

#### Enhancement: Toast notifications
Add a toast system for actions like card destroy, alert responses, and errors.
- **Files:** New `components/shared/Toast.tsx`, update action handlers
- **Effort:** 20 minutes

#### Enhancement: Camera integration in ChatPanel
Wire the camera button in the chat panel to actually open the CameraModal and show results in chat.
- **Files:** `ChatPanel.tsx`, `AIPanelWrapper.tsx`
- **Effort:** 10 minutes

### 2.2 Medium Priority (Polish)

#### Enhancement: Responsive mobile layout
The sidebar should collapse to a bottom nav on mobile. Dashboard grid should be single-column.
- **Files:** `Sidebar.tsx`, `DashboardLayout.tsx`, all grid components
- **Effort:** 30 minutes

#### Enhancement: Page transitions
Add smooth page transitions between dashboard, cards, and advisor pages.
- **Files:** `layout.tsx`, new transition wrapper
- **Effort:** 20 minutes

#### Enhancement: Error boundaries
Add React error boundaries around each dashboard section so one failing chart doesn't crash the whole page.
- **Files:** New `ErrorBoundary.tsx`, wrap each component
- **Effort:** 15 minutes

#### Enhancement: Real spending calculation for cards
Track actual spent_this_month by summing transactions for each virtual card in the current month.
- **Files:** `dashboard.py`, `cards.py`
- **Effort:** 15 minutes

#### Enhancement: Conversation history panel
Show past conversations with Vera in a sidebar within the advisor page.
- **Files:** `advisor/page.tsx`, new `ConversationList.tsx`
- **Effort:** 25 minutes

#### Enhancement: Dark mode toggle (if judges ask)
Add a dark/light toggle. Currently dark-only. The design system already has contrast notes.
- **Files:** `globals.css`, `layout.tsx`, context provider
- **Effort:** 30 minutes

### 2.3 Low Priority (Post-Hackathon)

#### Feature: Solana Receipt NFTs (Bonus)
Mint SPL tokens on devnet as on-chain receipts for transactions.
- **Files:** New `services/solana_service.py`, `routers/blockchain.py`, frontend badge
- **Effort:** 1 hour

#### Feature: Real Plaid Integration
Replace mock data with real bank account data via Plaid Link.
- **Files:** Major refactor of seed data, new Plaid service, new Link component
- **Effort:** 3-4 hours

#### Feature: NextAuth Authentication
Add Google OAuth login so multiple users can use the app.
- **Files:** `app/api/auth/[...nextauth]/route.ts`, middleware, session provider
- **Effort:** 1-2 hours

#### Feature: Webhook-based creep detection
Instead of pre-seeded alerts, use Stripe webhooks to detect charges in real-time.
- **Files:** New webhook endpoint, creep_detection integration
- **Effort:** 2 hours

#### Feature: PDF financial reports
Generate downloadable monthly financial summaries as PDF.
- **Files:** New report service, reportlab integration
- **Effort:** 1-2 hours

#### Feature: Budget forecasting
Use transaction history to predict end-of-month spending and warn about overages.
- **Files:** New forecasting service, new dashboard card
- **Effort:** 1-2 hours

#### Feature: Spending insights
Weekly AI-generated spending insights pushed as notifications.
- **Files:** New insights service, scheduler
- **Effort:** 1-2 hours

---

## Part 3: Pre-Demo Checklist

Run through this checklist before every demo presentation.

### Backend Verification
- [ ] Backend server is running (`uvicorn main:app --reload --port 8000`)
- [ ] Health check passes: `curl http://localhost:8000/api/health`
- [ ] Dashboard endpoint returns data: `curl http://localhost:8000/api/dashboard/YOUR_USER_ID`
- [ ] Netflix anomaly alert exists in the response's `pending_alerts` array
- [ ] Gemini responds to test message (not generic -- cites dollar amounts)

### Frontend Verification
- [ ] Frontend is running (`npm run dev`)
- [ ] User ID is set in localStorage
- [ ] Dashboard loads with all charts and data
- [ ] Netflix anomaly alert banner is visible at top
- [ ] Anomaly alert buttons work (test one action, then re-seed: `python seed_data.py`)
- [ ] AI chat works (type a question, get a response with real numbers)
- [ ] Camera upload works (upload a product photo, get a verdict)
- [ ] Cards page shows all 8 virtual cards
- [ ] Card destroy animation plays correctly (shake -> flash -> shrink)
- [ ] "Call Vera" button in sidebar opens voice call modal

### Demo Environment
- [ ] Browser at 1440px width (full desktop)
- [ ] Browser zoom at 100%
- [ ] Dark mode OS (matches the app)
- [ ] Product image ready for camera demo (e.g., Nike shoe, $120)
- [ ] No console errors visible
- [ ] Close all other tabs (clean presentation)

### If Something Breaks During Demo
- **Dashboard blank:** Check API URL in `.env.local`, restart backend
- **AI gives generic answer:** Verify GEMINI_API_KEY is valid, re-seed data
- **Camera fails:** Fall back to text -- type the purchase question manually
- **Voice call stuck on "connecting":** This is expected without ElevenLabs -- it falls back to mock mode in 1 second
- **Card animation broken:** Refresh the page, try again. The CSS animations are deterministic.
- **Netflix alert missing:** Re-run `python seed_data.py` to reset all data

---

## Part 4: Known Limitations

| Limitation | Why | Workaround |
|-----------|-----|-----------|
| Mock bank data only | Plaid requires weeks of approval | Be upfront with judges; architecture supports real Plaid |
| Stripe sandbox only | Issuing requires business verification | Mock fallback handles everything transparently |
| No real authentication | Demo app, single user | User ID in localStorage |
| Voice call is simulated | Requires ElevenLabs paid plan + agent setup | Mock mode provides realistic demo flow |
| Monthly chart uses hardcoded data | Backend aggregation not yet wired | Can be fixed in 15 minutes |
| No mobile bottom nav | Sidebar doesn't collapse | Optimized for 1440px desktop demo |

---

## Part 5: Sponsor Tech Integration Points

| Sponsor | Technology | Where Used | Demo Moment |
|---------|-----------|-----------|-------------|
| MongoDB | Atlas (Motor driver) | All data storage -- 8 collections | "All your data in one place" |
| Google | Gemini 1.5 Flash | AI advisor + vision | Camera purchase check |
| ElevenLabs | Conversational AI | Vera's voice | "Call Vera" button |
| Stripe | Issuing API | Virtual cards | Card destroy animation |
| Solana | Devnet (if implemented) | Receipt NFTs | Bonus -- "on-chain receipts" |

---

## Part 6: MongoDB Collections Reference

| Collection | Documents | Purpose |
|-----------|----------|---------|
| `users` | 1 (Alex Chen) | User profile + preferences |
| `financial_profiles` | 1 | Income, budget, net worth |
| `accounts` | 4 | Chase Checking, Marcus Savings, Chase Credit, Fidelity 401k |
| `virtual_cards` | 8 | One per subscription, merchant-locked |
| `subscriptions` | 8 | Netflix, Spotify, Planet Fitness, Adobe, iCloud, NYT, Amazon, Hulu |
| `transactions` | ~70 | 90 days of realistic spending data |
| `anomaly_alerts` | 1 | Netflix price increase (pending) |
| `notifications` | 1 | Price creep notification |
| `ai_conversations` | 0+ | Created when chatting with Vera |
