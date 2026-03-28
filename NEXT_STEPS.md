# Clearview -- Next Steps & Setup Guide

This document covers everything you need to do to get Clearview fully running, plus all the enhancements that can be made after the core build.

---

## Part 1: External Service Setup (Requires Your Accounts)

These are tasks that require your personal credentials, account access, or manual actions.

### 1.1 MongoDB (REQUIRED)

**Priority: CRITICAL -- nothing works without this.**

**Option A: Local Docker (recommended for development)**
```bash
docker run -d --name clearview-mongo -p 27017:27017 mongo:7
```
Then in `clearview/backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/clearview_db
```

**Option B: MongoDB Atlas (for deployment)**
1. Go to https://www.mongodb.com/cloud/atlas and create a free account
2. Create a free M0 cluster
3. Under "Database Access", create a user with read/write permissions
4. Under "Network Access", add `0.0.0.0/0` for development
5. Click "Connect" > "Drivers" > copy the connection string
6. Paste into `clearview/backend/.env` as `MONGODB_URI`

**Then seed the database:**
```bash
cd clearview/backend
pip install -r requirements.txt
python seed_data.py
```
Note the `USER ID` printed at the end -- you'll need it for the frontend.

### 1.2 Google Gemini API Key (REQUIRED)

**Priority: CRITICAL -- AI advisor and camera features need this.**

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Add to `.env`: `GEMINI_API_KEY=your-key`

Free tier: 60 req/min, 1500 req/day -- more than enough for demos.

### 1.3 ElevenLabs Setup (REQUIRED for voice features)

**Priority: HIGH -- needed for Vera voice calls and fraud detection calls.**

1. Go to https://elevenlabs.io and create an account
2. Settings > API Keys > copy your API key
3. Voice Lab > Voice Library > pick a warm professional voice > copy Voice ID
4. Conversational AI > Create Agent > configure Vera's personality > copy Agent ID
5. Add to `.env`:
   ```
   ELEVENLABS_API_KEY=your-key
   ELEVENLABS_VERA_VOICE_ID=voice-id
   ELEVENLABS_AGENT_ID=agent-id
   ```

### 1.4 Twilio + ElevenLabs Phone Number (REQUIRED for fraud call demo)

**Priority: HIGH -- needed for Vera to make outbound fraud verification calls.**

1. Create a free Twilio account at https://twilio.com (gives you a phone number + $15.50 credit)
2. In the Twilio Console, note your **Account SID** and **Auth Token**
3. In ElevenLabs, go to [Phone Numbers](https://elevenlabs.io/app/agents/phone-numbers)
4. Click "Import", enter:
   - Your Twilio phone number
   - Twilio Account SID
   - Twilio Auth Token
5. ElevenLabs will auto-configure the number. Copy the **Phone Number ID** shown
6. Add to `.env`:
   ```
   ELEVENLABS_PHONE_NUMBER_ID=the-phone-number-id
   USER_PHONE_NUMBER=+1XXXXXXXXXX
   FRAUD_AMOUNT_THRESHOLD=200.0
   ```

**To test the fraud call:**
```bash
curl -X POST http://localhost:8000/api/transactions/incoming \
  -H "Content-Type: application/json" \
  -d '{"user_id": "YOUR_USER_ID", "amount": -450.00, "merchant_name": "Louis Vuitton", "category": "shopping"}'
```
Vera will call the `USER_PHONE_NUMBER`, describe the suspicious transaction, and ask to confirm or deny.

### 1.5 Stripe Setup (OPTIONAL -- for real card operations)

**Priority: NICE TO HAVE -- card operations use mock data without Stripe.**

1. Go to https://dashboard.stripe.com and create an account
2. Toggle to "Test Mode"
3. Developers > API Keys > copy the Secret key (`sk_test_...`)
4. Apply for Stripe Issuing sandbox access
5. Once approved, create a Cardholder > copy the ID (`ich_...`)
6. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_CARDHOLDER_ID=ich_...
   ```

### 1.6 Solana Setup (OPTIONAL -- bonus feature, not yet implemented)

**Priority: LOW -- entirely optional bonus feature.**

Solana integration is scaffolded but not built. The data model has fields for:
- `User.solana_wallet_pubkey` -- Phantom wallet address
- `VirtualCard.solana_wallet` -- per-card wallet
- `Transaction.solana_receipt_tx` -- on-chain receipt tx hash

To implement, you would need:
1. A Phantom wallet (browser extension) or Solana CLI keypair
2. Solana devnet SOL (free from faucet: https://faucet.solana.com)
3. Build `services/solana_service.py` and `routers/blockchain.py` to mint SPL tokens as transaction receipts
4. Add an "On-chain Receipt" badge to the transaction UI

### 1.7 Deployment (OPTIONAL)

#### Frontend on Vercel
1. Push code to GitHub
2. Go to https://vercel.com, import the repo
3. Set root directory to `clearview/frontend`
4. Add env var: `NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app`
5. Deploy

#### Backend on Railway
1. Go to https://railway.app, connect GitHub
2. Set root directory to `clearview/backend`
3. Add all `.env` variables
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Deploy

---

## Part 2: Architecture Reference

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard/{user_id}` | Full dashboard data |
| POST | `/api/advisor/chat` | AI text chat with Vera |
| POST | `/api/advisor/vision` | Camera purchase check |
| GET | `/api/cards/{user_id}` | List virtual cards |
| POST | `/api/cards` | Create virtual card |
| POST | `/api/voice/session` | Start Vera voice session (browser) |
| POST | `/api/voice/tts` | Text-to-speech |
| GET | `/api/alerts/{user_id}` | Anomaly alerts (price creep) |
| POST | `/api/alerts/{alert_id}/action` | Respond to anomaly alert |
| **POST** | **`/api/transactions/incoming`** | **Ingest transaction + fraud detection + Vera call** |
| **GET** | **`/api/transactions/{user_id}`** | **List user transactions** |
| **POST** | **`/api/vera/call-result`** | **Record fraud call outcome** |
| **GET** | **`/api/vera/alerts/{user_id}`** | **List fraud alerts** |
| **GET** | **`/api/vera/alert/{alert_id}`** | **Single fraud alert detail** |

(Bold = new endpoints from the agentic fraud detection feature)

### Fraud Detection Flow

```
New Transaction → POST /api/transactions/incoming
       ↓
Fraud Detection Service evaluates:
  • Amount > $200 threshold? → HIGH severity
  • First-time merchant + amount > $100? → MEDIUM severity  
  • Category spend 3x monthly average? → MEDIUM severity
       ↓ (if flagged)
Create fraud_alert doc (status: "pending")
       ↓
Background task: Vera Caller Orchestrator
  • Builds dynamic prompt with transaction + financial context
  • Calls ElevenLabs outbound API → Twilio phone call
  • Vera speaks to user: describes transaction, asks confirm/deny
       ↓
POST /api/vera/call-result (resolution: user_confirmed | user_denied | no_answer)
  • user_confirmed → approve transaction
  • user_denied → deny transaction + freeze card + notify
  • no_answer → alert stays open for follow-up
```

### MongoDB Collections

| Collection | Documents | Purpose |
|-----------|----------|---------|
| `users` | 1 (Alex Chen) | User profile + preferences + phone number |
| `financial_profiles` | 1 | Income, budget, net worth |
| `accounts` | 4 | Chase Checking, Marcus Savings, Chase Credit, Fidelity 401k |
| `virtual_cards` | varies | Merchant-locked virtual cards |
| `subscriptions` | 8 | Netflix, Spotify, Planet Fitness, Adobe, iCloud, NYT, Amazon, Hulu |
| `transactions` | ~70+ | 90 days of spending data + ingested transactions |
| `anomaly_alerts` | 1+ | Price creep alerts (Netflix) |
| `fraud_alerts` | 0+ | Fraud detection alerts from transaction ingestion |
| `notifications` | 1+ | User notifications |
| `ai_conversations` | 0+ | Chat and voice sessions with Vera |

---

## Part 3: Enhancements & Code Improvements

### 3.1 High Priority (Before Demo)

#### Enhancement: Monthly trend chart from real data
Currently uses hardcoded data. Backend should aggregate 6 months of transactions.
- **Files:** `routers/dashboard.py`, `frontend/app/dashboard/page.tsx`
- **Effort:** 15 minutes

#### Enhancement: Subscription logos
Add real SVG logos for Netflix, Spotify, etc. using Simple Icons CDN.
- **Files:** Multiple subscription/card components
- **Effort:** 15 minutes

#### Enhancement: Toast notifications
Add a toast system for card actions, alert responses, fraud call results.
- **Files:** New `components/shared/Toast.tsx`, update action handlers
- **Effort:** 20 minutes

#### Enhancement: Camera integration in ChatPanel
Wire the camera button in chat to open CameraModal and show results.
- **Files:** `ChatPanel.tsx`, `AIPanelWrapper.tsx`
- **Effort:** 10 minutes

### 3.2 Medium Priority (Polish)

#### Enhancement: Responsive mobile layout
Sidebar collapses to bottom nav on mobile. Dashboard grid goes single-column.
- **Files:** `Sidebar.tsx`, `DashboardLayout.tsx`
- **Effort:** 30 minutes

#### Enhancement: Page transitions
Smooth transitions between dashboard, cards, and advisor pages.
- **Files:** `layout.tsx`, new transition wrapper
- **Effort:** 20 minutes

#### Enhancement: Error boundaries
React error boundaries around each dashboard section.
- **Files:** New `ErrorBoundary.tsx`
- **Effort:** 15 minutes

#### Enhancement: Real spending calculation for cards
Track spent_this_month by summing transactions per card in current month.
- **Files:** `dashboard.py`, `cards.py`
- **Effort:** 15 minutes

#### Enhancement: Conversation history panel
Show past Vera conversations in the advisor page.
- **Files:** `advisor/page.tsx`, new `ConversationList.tsx`
- **Effort:** 25 minutes

### 3.3 Low Priority (Post-Hackathon)

#### Feature: Solana Receipt NFTs (Bonus)
Mint SPL tokens on devnet as on-chain receipts for transactions.
- **Files:** New `services/solana_service.py`, `routers/blockchain.py`, frontend badge
- **Effort:** 1 hour

#### Feature: Real Plaid Integration
Replace mock data with real bank account data via Plaid Link.
- **Files:** Major refactor, new Plaid service, new Link component
- **Effort:** 3-4 hours

#### Feature: NextAuth Authentication
Add Google OAuth login for multi-user support.
- **Files:** `app/api/auth/[...nextauth]/route.ts`, middleware
- **Effort:** 1-2 hours

#### Feature: Stripe Webhooks for Real-Time Creep Detection
Instead of pre-seeded alerts, use Stripe webhooks to detect charges in real-time.
- **Files:** New webhook endpoint, creep_detection integration
- **Effort:** 2 hours

#### Feature: PDF Financial Reports
Generate downloadable monthly financial summaries.
- **Files:** New report service, reportlab integration
- **Effort:** 1-2 hours

---

## Part 4: Pre-Demo Checklist

### Backend
- [ ] Backend running: `cd clearview/backend && uvicorn main:app --reload --port 8000`
- [ ] Health check: `curl http://localhost:8000/api/health`
- [ ] Dashboard returns data: `curl http://localhost:8000/api/dashboard/YOUR_USER_ID`
- [ ] Gemini responds with real numbers (not generic advice)
- [ ] Fraud detection endpoint works: `curl -X POST http://localhost:8000/api/transactions/incoming -H "Content-Type: application/json" -d '{"user_id":"YOUR_USER_ID","amount":-450,"merchant_name":"Test Store","category":"shopping"}'`

### Frontend
- [ ] Frontend running: `cd clearview/frontend && npm run dev`
- [ ] User ID set in localStorage or `.env.local`
- [ ] Dashboard loads with charts and data
- [ ] Netflix anomaly alert banner visible
- [ ] AI chat works with real financial data
- [ ] Camera upload works
- [ ] Cards page shows virtual cards
- [ ] "Call Vera" button opens voice modal

### Fraud Call Demo
- [ ] Twilio phone number imported into ElevenLabs
- [ ] `ELEVENLABS_PHONE_NUMBER_ID` and `USER_PHONE_NUMBER` set in `.env`
- [ ] Backend restarted after adding env vars
- [ ] Test: POST a large transaction → phone rings → Vera describes it → confirm/deny

### Demo Environment
- [ ] Browser at 1440px width (full desktop)
- [ ] Browser zoom at 100%
- [ ] Dark mode OS (matches the app)
- [ ] Product image ready for camera demo (e.g., Nike shoe, $120)
- [ ] No console errors visible
- [ ] Close all other tabs

### If Something Breaks During Demo
- **Dashboard blank:** Check API URL in `.env.local`, restart backend
- **AI gives generic answer:** Verify `GEMINI_API_KEY`, re-seed data
- **Camera fails:** Fall back to text chat -- type the purchase question manually
- **Voice call stuck:** Expected without ElevenLabs -- falls back to mock in 1 second
- **Fraud call not ringing:** Check `ELEVENLABS_PHONE_NUMBER_ID` and `USER_PHONE_NUMBER` in `.env`
- **Card animation broken:** Refresh page, try again
- **Netflix alert missing:** Re-run `python seed_data.py`

---

## Part 5: Environment Variables Reference

All variables for `clearview/backend/.env`:

```bash
# === REQUIRED ===
MONGODB_URI=mongodb://localhost:27017/clearview_db
MONGODB_DB_NAME=clearview_db
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.5-flash

# === VOICE (required for Vera voice features) ===
ELEVENLABS_API_KEY=your-elevenlabs-key
ELEVENLABS_AGENT_ID=your-agent-id
ELEVENLABS_VERA_VOICE_ID=your-voice-id

# === FRAUD CALL (required for outbound fraud verification) ===
ELEVENLABS_PHONE_NUMBER_ID=your-phone-number-id
USER_PHONE_NUMBER=+1XXXXXXXXXX
FRAUD_AMOUNT_THRESHOLD=200.0

# === STRIPE (optional, mock fallback) ===
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CARDHOLDER_ID=ich_...

# === GENERAL ===
FRONTEND_URL=http://localhost:3000
```

Frontend variables for `clearview/frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLEARVIEW_USER_ID=your-seeded-user-id
```

---

## Part 6: Sponsor Tech Integration Points

| Sponsor | Technology | Where Used | Demo Moment |
|---------|-----------|-----------|-------------|
| MongoDB | Atlas / local (Motor driver) | All data storage -- 9+ collections | "All your data in one place" |
| Google | Gemini 2.5 Flash | AI advisor + vision + fraud context | Camera purchase check, fraud call context |
| ElevenLabs | Conversational AI + Twilio | Vera voice calls + outbound fraud calls | "Call Vera" button + fraud auto-call |
| Stripe | Issuing API | Virtual card creation & management | Card destroy animation |
| Solana | Devnet (scaffolded) | Receipt NFTs (bonus, not yet built) | "On-chain receipts" |
