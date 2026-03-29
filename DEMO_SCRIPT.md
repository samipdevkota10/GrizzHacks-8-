# VeraFund — GrizzHacks 8 Demo Script
## 3-Minute Pitch · Fintech Track

---

### BEFORE JUDGES ARRIVE — Pre-stage checklist
- [ ] Dashboard open on laptop, logged in as Alex Chen
- [ ] AI Advisor open on second tab, ready to type
- [ ] Phone (with Vera's number) visible on table or in hand
- [ ] All fraud alerts cleared (no active banner)
- [ ] Vera Activity timeline shows at least 1-2 past resolved alerts
- [ ] Phone volume UP

---

## [0:00 – 0:25] THE HOOK
> *Walk up confidently, point at the screen*

**"$10 billion dollars lost to payment fraud last year in the US alone.
Your bank texts you AFTER the money is already gone.
What if your AI guardian called you BEFORE the charge went through — in real time?
Meet Vera."**

*Pause 2 seconds. Let it land.*

---

## [0:25 – 0:55] QUICK DASHBOARD TOUR
> *Gesture to the dashboard overview*

**"This is Alex — a college student. Vera monitors every single transaction in real time.
You can see right here: 'Vera is monitoring your accounts' — 24/7, always on."**

> *Point to the live pulse indicator*

**"Down here, Vera's activity timeline — she already blocked a $1,250 suspicious charge this week.
That's not a demo mockup. That was a real test we just ran."**

> *Point to stat cards, spend 5 seconds max*

**"Spending trends, budget breakdowns, upcoming bills — all of it live."**

---

## [0:55 – 1:50] THE WOW MOMENT — LIVE FRAUD DEMO
> *This is the make-or-break moment. Stay calm and confident.*

**"Watch what happens right now when a suspicious charge comes in."**

> *Click "Test fraud" button*

**"Vera's 8-signal AI engine just scored this transaction as high risk.
Out-of-pattern merchant. Abnormal amount. Suspicious timing.
She doesn't wait for a rule to trigger. She analyzes every single transaction."**

> *The fraud alert banner slides in with animation*

**"And now — she's calling."**

> *Phone rings. Pick it up naturally.*

[ON CALL — speak clearly]
"No — I didn't authorize that."

[Hang up]

**"That's it. Done."**

> *Dashboard auto-updates within 15 seconds — show the "Blocked" status*

**"Vera heard 'no' on that call, matched it to the alert in real time, and blocked the charge.
No manual steps. No app interaction needed. The fraud is stopped."**

---

## [1:50 – 2:20] AI ADVISOR + PURCHASE ANALYZER
> *Switch to AI Advisor tab or scroll to it*

**"But Vera isn't just fraud protection. She's your full financial guardian."**

> *Type quickly: "Can I afford new AirPods this month?"*

**"Ask Vera any financial question — she knows your real spending, your budget, your goals.
She gives you personalized advice, not generic tips."**

> *While Vera responds (or show a pre-loaded response):*

**"And she can analyze any purchase with just a photo — receipt OCR, spending impact, whether it fits your budget."**

---

## [2:20 – 2:50] TECH STACK + DIFFERENTIATION
> *Scroll to the Tech Stack card at the bottom and expand it*

**"Under the hood: Google Gemini for AI reasoning, ElevenLabs for the voice call,
Plaid for real bank data, Stripe Issuing for virtual cards, MongoDB for everything.

Our fraud engine uses 8 independent signals — geolocation, merchant familiarity, spending velocity, time-of-day anomalies, category mismatch — combined into an explainable risk score.
No black box. Every flag has a human-readable reason."**

---

## [2:50 – 3:00] CLOSE
> *Make eye contact, confident*

**"VeraFund. Your money finally has someone watching over it."**

*Step back. Smile. Let them ask questions.*

---

## LIKELY JUDGE QUESTIONS + ANSWERS

**Q: How does the call work technically?**
A: ElevenLabs ConvAI agent initiates an outbound Twilio call. The agent has a dynamic fraud prompt built with Gemini — it knows the exact merchant, amount, and why we flagged it. When the user says yes/no, Vera calls our backend webhook, which updates the transaction status and freezes the card if needed.

**Q: Is the bank data real?**
A: We use Plaid's API for real bank account and transaction sync. For the demo user we seed realistic synthetic data — same data model, same API calls. A real user would link their actual bank account.

**Q: What if the call isn't answered?**
A: Vera sends an SMS fallback — "Suspicious $X charge at [merchant]. Log in to review." And we show the alert on the dashboard for manual review.

**Q: How accurate is the fraud detection?**
A: We use 8 heuristic signals with weighted scoring. In our test data, we tune thresholds to minimize false positives for a student spending profile. A production version would add ML retraining on user feedback.

**Q: Could you monetize this?**
A: B2C subscription ($3-5/month) or B2B white-label for community banks and credit unions who can't afford enterprise fraud tools.

---

## TIMING REFERENCE
| Section | Duration | Cumulative |
|---------|----------|------------|
| Hook | 25s | 0:25 |
| Dashboard tour | 30s | 0:55 |
| Fraud demo (call) | 55s | 1:50 |
| AI Advisor | 30s | 2:20 |
| Tech stack | 30s | 2:50 |
| Close | 10s | 3:00 |

**Practice tip:** Time yourself 5 times. The fraud call adds unpredictability — have a fallback sentence ready: "While Vera's calling... [describe what's happening on screen]."
