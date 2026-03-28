# Clearview MVP — External Setup & Runbook

This guide covers accounts, API keys, local development, and hosting so you can get the POC/MVP running end-to-end. Pair with [PRD.md](PRD.md) and your merged master build prompt.

---

## Part 0 — What you’re setting up

| Piece | Role |
|--------|------|
| **MongoDB Atlas** | All app data (users, seed data, `anomaly_alerts`, etc.) |
| **Gemini API** | Vera chat + vision (“Can I afford this?”) |
| **Stripe Issuing (test)** | Virtual cards, pause/destroy, spending limits (sandbox) |
| **ElevenLabs** | TTS + optional conversational/voice agent |
| **NextAuth + Google OAuth** (optional) | Auth for the Next.js app |
| **Vercel** (typical) | Host Next.js frontend |
| **GCP Cloud Run** (recommended backend) | Host FastAPI backend |

**Note:** Most services require a card on file or free-tier signup. Enable billing alerts in GCP and Stripe.

---

## Part 1 — MongoDB Atlas

**Goal:** Cluster + connection string + database name + network access.

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up or log in.
2. Create a **project** (e.g. `clearview`).
3. Create a **cluster** — M0 free tier is fine for MVP.
4. **Database access:** Create a database user (username + password). Save the password securely.
5. **Network access:**
   - **Development:** Add IP `0.0.0.0/0` (anywhere) so laptops and Cloud Run can connect; tighten for production.
   - **Stricter:** Add only your current IP (changes when your network changes).
6. **Connect** → Drivers → copy the **`mongodb+srv://...`** connection string.
7. Replace `<password>` with your database user password.
8. Set in backend `.env`:
   - `MONGODB_URI=mongodb+srv://...`
   - `MONGODB_DB_NAME=clearview_db` (or match your code)

**Smoke test:** After running `seed_data.py`, open Atlas → **Browse Collections** and confirm collections exist.

---

## Part 2 — Google Gemini

**Goal:** API key used only by **FastAPI** (never expose in the browser).

### Option A — Google AI Studio (fastest for MVP)

1. Open [Google AI Studio](https://aistudio.google.com/) (or Google AI for Developers).
2. Create an **API key** for Gemini.
3. Prefer restricting the key (avoid using it in frontend; backend-only).
4. Set in backend `.env`:
   - `GEMINI_API_KEY=...`
   - `GEMINI_MODEL=gemini-1.5-flash` (confirm exact model id in the SDK docs you use)

### Option B — Vertex AI on GCP (later / production)

Enable Vertex AI in a GCP project; use service account + Application Default Credentials. More setup; skip for first POC unless you already use GCP for everything.

**Smoke test:** From the same environment as FastAPI will use, run a one-line script or `curl` flow that calls Gemini with your key.

---

## Part 3 — Stripe (Issuing in test mode)

**Goal:** `sk_test_...`, a **test cardholder**, and IDs your app stores.

1. Sign up at [stripe.com](https://stripe.com) and complete basic account steps.
2. Stay in **Test mode** (dashboard toggle).
3. **Issuing**
   - Open **Issuing** in the Stripe Dashboard (location varies by dashboard version).
   - **Issuing may require extra business verification** and is **not available in all countries.** If Issuing is blocked, plan B: stub card UI for demo or apply for access early.
4. **Create a test Cardholder** (Issuing → Cardholders → Create). Copy the **Cardholder ID** (e.g. `ich_...`).
5. **API keys:** Developers → API keys → **Secret key** `sk_test_...` — backend only:
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `STRIPE_CARDHOLDER_ID=ich_...` (or whatever your code expects)

**Webhooks:** Optional for MVP if you simulate charges and use seeded anomaly data. For real authorization events later, add Issuing webhooks and verify signatures.

**Smoke test:** Create one virtual card via API or Stripe CLI; confirm it appears under Issuing → Cards in the Dashboard.

---

## Part 4 — ElevenLabs

**Goal:** API key + voice + optional agent.

1. Sign up at [elevenlabs.io](https://elevenlabs.io).
2. Create an **API key** (account/API settings).
   - `ELEVENLABS_API_KEY=...`
3. Pick or design a **voice**; copy **Voice ID**:
   - `ELEVENLABS_VERA_VOICE_ID=...`
4. If you use **Conversational AI / Agents**, create an agent and copy **Agent ID**:
   - `ELEVENLABS_AGENT_ID=...`  
   If you only use **TTS** to read Vera’s text, you may omit the agent at first.

**Smoke test:** Call TTS from the backend with one sentence; confirm audio returns and plays.

---

## Part 5 — NextAuth + Google OAuth (if using Google login)

**Goal:** `NEXTAUTH_SECRET`, Google OAuth client, correct callback URLs.

1. In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials** → Create **OAuth client ID** (Web application).
2. **Authorized JavaScript origins:**
   - `http://localhost:3000`
   - Production: `https://your-app.vercel.app`
3. **Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-app.vercel.app/api/auth/callback/google`
4. Frontend `.env.local`:
   - `NEXTAUTH_URL=http://localhost:3000` (update in production)
   - `NEXTAUTH_SECRET=` (long random string, e.g. `openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`

After first Vercel deploy, **add the production URLs** to Google OAuth or login will fail.

---

## Part 6 — Solana devnet (bonus only)

1. `SOLANA_NETWORK=devnet`
2. `SOLANA_RPC_URL=https://api.devnet.solana.com` (or a free RPC from Helius/QuickNode)
3. Generate a devnet keypair for minting; fund with devnet SOL from a faucet if required.

Skip until core features work.

---

## Part 7 — Environment variables (reference)

### Backend `.env`

```bash
MONGODB_URI=mongodb+srv://YOUR_ATLAS_URI
MONGODB_DB_NAME=clearview_db
GEMINI_API_KEY=YOUR_GEMINI_KEY
GEMINI_MODEL=gemini-1.5-flash
ELEVENLABS_API_KEY=YOUR_ELEVENLABS_KEY
ELEVENLABS_AGENT_ID=YOUR_VERA_AGENT_ID
ELEVENLABS_VERA_VOICE_ID=YOUR_VERA_VOICE_ID
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_TEST_KEY
STRIPE_CARDHOLDER_ID=ich_YOUR_CARDHOLDER_ID
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
# If using Google OAuth:
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

---

## Part 8 — Local POC run order

1. Clone the repo and copy env files; fill MongoDB, Gemini, Stripe, ElevenLabs (minimum for the features you’re testing).
2. **Backend**
   - Python 3.11+ virtualenv
   - `pip install -r requirements.txt`
   - Run seed script (e.g. `python seed_data.py`) so the Netflix anomaly exists in DB
   - `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
3. **Frontend**
   - `npm install`
   - `NEXT_PUBLIC_API_URL=http://localhost:8000`
   - `npm run dev`
4. **Browser:** Open the dashboard — confirm seeded anomaly alert, charts, and advisor (Gemini) work.

---

## Part 9 — Hosting

### Frontend — Vercel

1. Push the repo to GitHub.
2. [vercel.com](https://vercel.com) → Import project → select the repo → framework Next.js.
3. Set environment variables (`NEXT_PUBLIC_API_URL`, `NEXTAUTH_*`, Google OAuth, etc.).
4. Deploy; copy production URL and **update Google OAuth** redirect URIs to match.

### Backend — GCP Cloud Run

**Goal:** Container image + Cloud Run service + secrets + HTTPS.

1. In GCP: create/select a project; enable **Cloud Run**, **Artifact Registry**, and optionally **Secret Manager**.
2. Add a **Dockerfile** for FastAPI that listens on **port 8080** (Cloud Run default).
3. Build and push the image to Artifact Registry.
4. Deploy to Cloud Run:
   - Set environment variables (or mount secrets from Secret Manager).
   - For a public API, allow unauthenticated invocations **or** use IAM if the API is internal-only.
5. Copy the **service URL** and set:
   - `NEXT_PUBLIC_API_URL=https://YOUR-SERVICE-XXXX.run.app` on Vercel.
6. **CORS:** Allow your Vercel origin in FastAPI.

**Secrets:** Prefer **Secret Manager** over pasting keys in the Cloud Run console for anything long-lived.

### Alternative — Railway (backend only)

Connect the repo, set the same env vars, deploy FastAPI. Faster path if you want to skip Docker/GCP for the hackathon.

---

## Part 10 — MVP tiers (what to turn on in order)

**Tier 1 — Core without voice/cards**

1. MongoDB Atlas  
2. Gemini  
3. Seed data + dashboard API + UI  

**Tier 2 — Demo differentiators**

4. Advisor + purchase-check (vision)  
5. Anomaly alerts (seeded + `/api/alerts` + UI)  

**Tier 3 — Stripe Issuing**

6. Test keys + cardholder + virtual card CRUD + destroy flow  

**Tier 4 — Polish**

7. ElevenLabs TTS / voice session  
8. Production URLs on Vercel + Cloud Run + OAuth callbacks  

**Tier 5 — Bonus**

9. Solana receipt minting  

---

## Part 11 — Common blockers (check early)

| Issue | What to do |
|--------|------------|
| Stripe Issuing unavailable | Confirm country/eligibility early; have a stub or simplified cards demo as fallback |
| Gemini model name drift | Match the name to your SDK version in docs |
| CORS errors | Align `NEXT_PUBLIC_API_URL` with real backend URL; allow Vercel origin in FastAPI |
| Google OAuth fails in prod | Redirect URIs must match **exactly** (https, no trailing slash mismatch) |
| Atlas connection refused | Check network access list and that password is URL-encoded if special characters |

---

## Related docs

- [PRD.md](PRD.md) — product requirements and technical spec  
- Merged master build prompt — phase-by-phase implementation (paste at start of coding sessions)
