import asyncio
import json
import logging
import random
import re

import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable, DeadlineExceeded, GoogleAPICallError
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

logger = logging.getLogger(__name__)

_GEMINI_SEMAPHORE = asyncio.Semaphore(3)


async def _call_with_retry(coro_fn, max_retries: int = 5):
    """Call a Gemini async function with retry + exponential backoff + jitter."""
    async with _GEMINI_SEMAPHORE:
        for attempt in range(max_retries + 1):
            try:
                return await coro_fn()
            except ResourceExhausted:
                if attempt == max_retries:
                    raise
                base_wait = min(2 ** (attempt + 1), 60)
                jitter = random.uniform(0, base_wait * 0.5)
                wait = base_wait + jitter
                logger.warning("Gemini 429 rate-limited, retrying in %.1fs (attempt %d/%d)", wait, attempt + 1, max_retries)
                await asyncio.sleep(wait)
            except (ServiceUnavailable, DeadlineExceeded, GoogleAPICallError):
                if attempt == max_retries:
                    raise
                base_wait = min(2 ** (attempt + 1), 30)
                jitter = random.uniform(0, base_wait * 0.3)
                wait = base_wait + jitter
                logger.warning("Gemini transient error, retrying in %.1fs (attempt %d/%d)", wait, attempt + 1, max_retries)
                await asyncio.sleep(wait)

SYSTEM_PROMPT_TEMPLATE = '''You are Vera, {user_name}'s personal financial advisor inside the VeraFund app.

{context_text}

PERSONALITY:
- Direct, warm, and honest. Never sugarcoat bad financial news.
- ALWAYS cite specific dollar amounts from the user's actual data above.
- NEVER give generic advice like "try to save more" without specific context.
- Respond in 120 words or fewer unless a detailed breakdown is explicitly requested.
- Slight dry sense of humor — you're a friend who happens to know finance.
- When asked "can I afford X", always calculate it explicitly with their numbers.
- Refer to yourself as Vera, not as "an AI" or "assistant".

RULES:
1. Ground every response in the user's specific numbers.
2. Never say "generally speaking" or "it's important to..."
3. If the user asks about a purchase, calculate the impact on discretionary budget.
4. If a subscription looks wasteful, flag it proactively.
5. Be a financial ally, not a financial lecture.'''


VISION_EXTRACTION_PROMPT = """Analyze this image and extract the product and its price.
Return ONLY valid JSON with no other text, markdown, or code fences:
{"product": "exact product name", "price": 00.00, "currency": "USD"}

Rules:
- If the price is clearly visible, use the exact price.
- If no price is visible, estimate the typical retail price for this product.
- If the image shows multiple products, pick the most prominent one.
- Always return valid JSON. Nothing else."""


PURCHASE_ANALYSIS_PROMPT = """You are analyzing a potential purchase for {user_name}.

PRODUCT: {product}
PRICE: ${price:.2f}

THEIR FINANCIAL SITUATION:
- After-tax hourly rate: ${net_hourly_rate:.2f}/hr
- Discretionary budget remaining this month: ${discretionary_remaining:.2f}
- Monthly budget: ${monthly_budget:.2f} (spent ${month_spent:.2f} so far)
- Checking balance: ${checking_balance:.2f}
- Monthly savings: ${monthly_savings:.2f}/month
- Upcoming bills in next 30 days: ${upcoming_bills:.2f}
- Net worth: ${net_worth:.2f}

SPENDING BY CATEGORY THIS MONTH:
{category_spending_text}

FINANCIAL GOALS:
{goals_text}

Return ONLY valid JSON (no markdown, no code fences, no extra text):
{{
  "verdict": "GO_FOR_IT" or "THINK_TWICE" or "HOLD_OFF" or "HARD_NO",
  "reasoning": "2-3 sentence Vera-style explanation citing specific dollar amounts from the data above. Be direct, warm, and honest.",
  "hours_of_work": <number: price divided by after-tax hourly rate, rounded to 1 decimal>,
  "days_of_work": <number: hours_of_work / 8, rounded to 1 decimal>,
  "budget_impact_percent": <number: what percentage of remaining monthly budget this eats, rounded to 1 decimal>,
  "category_context": "1 sentence about how much they've already spent in a related category this month",
  "goal_delays": [
    {{"goal_name": "goal name", "delayed_by_weeks": <number: price / (monthly_savings / 4), rounded to 1 decimal>}}
  ],
  "alternatives": [
    {{"name": "cheaper alternative product name", "estimated_price": <number>}},
    {{"name": "another alternative", "estimated_price": <number>}}
  ],
  "total_cost_note": "If this is a subscription or has recurring costs, estimate annual cost. Otherwise null.",
  "thirty_day_suggestion": <boolean: true if price > 15% of remaining budget and verdict is not GO_FOR_IT>
}}

VERDICT RULES:
- GO_FOR_IT: price < 5% of remaining budget AND won't impact any goals significantly
- THINK_TWICE: price is 5-25% of remaining budget, manageable but worth considering
- HOLD_OFF: price is 25-60% of remaining budget OR delays a goal by > 4 weeks
- HARD_NO: price exceeds remaining budget OR would cause financial strain"""


RECEIPT_SCAN_PROMPT = """Extract all information from this receipt image.
Return ONLY valid JSON (no markdown, no code fences, no extra text):
{{
  "merchant": "Store/Restaurant name",
  "date": "YYYY-MM-DD or null if not visible",
  "items": [
    {{"name": "item name", "price": 0.00, "quantity": 1, "category": "food|shopping|entertainment|health|transport|utilities|other"}}
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "payment_method": "cash|credit|debit|other or null if not visible"
}}

Rules:
- Extract every line item you can read from the receipt.
- Assign each item a spending category from: food, shopping, entertainment, health, transport, utilities, other.
- If the receipt is from a restaurant or grocery store, categorize items as "food".
- If you can't read a value clearly, estimate it.
- Always return valid JSON. Nothing else."""


def _parse_json_response(text: str) -> dict | None:
    """Extract JSON from a model response, handling code fences and extra text."""
    if not text:
        return None
    text = text.strip()

    # Strip ```json ... ``` fences anywhere in the text
    fence_match = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find the outermost { ... } block
    depth = 0
    start = -1
    for i, ch in enumerate(text):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start >= 0:
                try:
                    return json.loads(text[start : i + 1])
                except json.JSONDecodeError:
                    start = -1
    return None


def _parse_extraction_fallback(text: str) -> dict | None:
    """
    Parse backup extraction format:
      PRODUCT=<name>;PRICE=<number>;CURRENCY=<code>
    """
    if not text:
        return None
    m_prod = re.search(r"PRODUCT\s*=\s*([^;]+)", text, re.IGNORECASE)
    m_price = re.search(r"PRICE\s*=\s*([-+]?\d+(?:\.\d+)?)", text, re.IGNORECASE)
    m_cur = re.search(r"CURRENCY\s*=\s*([A-Z]{3})", text, re.IGNORECASE)
    if not m_prod or not m_price:
        return None
    try:
        price = float(m_price.group(1))
    except (TypeError, ValueError):
        return None
    return {
        "product": m_prod.group(1).strip(),
        "price": price,
        "currency": (m_cur.group(1).upper() if m_cur else "USD"),
    }


class GeminiService:
    def __init__(self):
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        self.vision_model = genai.GenerativeModel(settings.GEMINI_MODEL)

    async def chat(self, message: str, context: dict, history: list[dict] | None = None) -> str:
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(**context)

        contents = [
            {"role": "user", "parts": [{"text": system_prompt}]},
            {"role": "model", "parts": [{"text": "Understood. I'm Vera, ready to help with your finances using your specific data."}]},
        ]

        if history:
            for msg in history[-10:]:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        contents.append({"role": "user", "parts": [{"text": message}]})

        response = await _call_with_retry(lambda: self.model.generate_content_async(
            contents,
            generation_config=genai.GenerationConfig(temperature=0.3, max_output_tokens=2048),
        ))
        return response.text or "I'm having trouble processing that right now. Could you rephrase?"

    async def purchase_vision_check(self, image_bytes: bytes, context: dict) -> dict:
        import PIL.Image
        import io

        image = PIL.Image.open(io.BytesIO(image_bytes))

        extraction_response = await _call_with_retry(lambda: self.vision_model.generate_content_async(
            [VISION_EXTRACTION_PROMPT, image],
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                max_output_tokens=2048,
                response_mime_type="application/json",
            ),
        ))

        extracted = _parse_json_response(extraction_response.text)
        if not extracted:
            logger.warning("Vision extraction failed to parse: %s", extraction_response.text[:300])
            # Fallback pass: ask for a strict key=value one-liner and parse it.
            fallback_response = await _call_with_retry(lambda: self.vision_model.generate_content_async(
                [
                    (
                        "From this image, identify the main product and its visible price. "
                        "Return EXACTLY one line in this format with no extra text: "
                        "PRODUCT=<name>;PRICE=<number>;CURRENCY=USD"
                    ),
                    image,
                ],
                generation_config=genai.GenerationConfig(
                    temperature=0.0,
                    max_output_tokens=128,
                ),
            ))
            extracted = _parse_extraction_fallback((fallback_response.text or "").strip())
            if not extracted:
                extracted = {"product": "Unknown Product", "price": 0.0, "currency": "USD"}

        product = extracted.get("product") or "Unknown Product"
        raw_price = extracted.get("price", 0)
        try:
            price = float(raw_price)
        except (TypeError, ValueError):
            price = 0.0

        cat_spending = context.get("spending_by_category", {})
        cat_text = "\n".join(f"  - {c}: ${a:,.2f}" for c, a in sorted(cat_spending.items(), key=lambda x: -x[1]))

        goals = context.get("financial_goals", [])
        goals_text_lines = []
        for g in goals:
            remaining = g["target_amount"] - g.get("current_amount", 0)
            goals_text_lines.append(f"  - {g['name']}: ${g.get('current_amount', 0):,.2f} / ${g['target_amount']:,.2f} (${remaining:,.2f} left)")
        goals_text = "\n".join(goals_text_lines) if goals_text_lines else "  No goals set"

        analysis_prompt = PURCHASE_ANALYSIS_PROMPT.format(
            user_name=context.get("user_name", "there"),
            product=product,
            price=price,
            net_hourly_rate=context.get("net_hourly_rate", 16.4),
            discretionary_remaining=context.get("discretionary_remaining", 0),
            monthly_budget=context.get("monthly_budget", 2000),
            month_spent=context.get("month_spent", 0),
            checking_balance=context.get("checking_balance", 0),
            monthly_savings=context.get("monthly_savings", 0),
            upcoming_bills=context.get("upcoming_bills_30d", 0),
            net_worth=context.get("net_worth", 0),
            category_spending_text=cat_text or "  No spending recorded",
            goals_text=goals_text,
        )

        system = SYSTEM_PROMPT_TEMPLATE.format(**context)
        advice_response = await _call_with_retry(lambda: self.model.generate_content_async(
            [
                {"role": "user", "parts": [{"text": system}]},
                {"role": "model", "parts": [{"text": "Ready to evaluate this purchase with the user's real financial data."}]},
                {"role": "user", "parts": [{"text": analysis_prompt}]},
            ],
            generation_config=genai.GenerationConfig(
                temperature=0.3,
                max_output_tokens=4096,
                response_mime_type="application/json",
            ),
        ))

        analysis = _parse_json_response(advice_response.text)

        if not analysis:
            logger.warning("Purchase analysis parse failed: %s", advice_response.text[:300])
            reasoning = "Vera couldn't fully analyze this purchase. Please try again with a clearer product image."
            net_hr = context.get("net_hourly_rate", 16.4)
            hours = round(price / net_hr, 1) if net_hr > 0 else 0
            analysis = {
                "verdict": "THINK_TWICE",
                "reasoning": reasoning,
                "hours_of_work": hours,
                "days_of_work": round(hours / 8, 1),
                "budget_impact_percent": round(price / max(context.get("discretionary_remaining", 1), 1) * 100, 1),
                "category_context": "",
                "goal_delays": [],
                "alternatives": [],
                "total_cost_note": None,
                "thirty_day_suggestion": price > context.get("discretionary_remaining", 0) * 0.15,
            }

        return {
            "product": product,
            "price": price,
            "currency": extracted.get("currency", "USD"),
            **analysis,
        }

    async def scan_receipt(self, image_bytes: bytes) -> dict:
        import PIL.Image
        import io

        image = PIL.Image.open(io.BytesIO(image_bytes))

        response = await _call_with_retry(lambda: self.vision_model.generate_content_async(
            [RECEIPT_SCAN_PROMPT, image],
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                max_output_tokens=4096,
                response_mime_type="application/json",
            ),
        ))

        result = _parse_json_response(response.text)
        if not result:
            result = {
                "merchant": "Unknown",
                "date": None,
                "items": [],
                "subtotal": 0,
                "tax": 0,
                "total": 0,
                "payment_method": None,
            }

        return result

    async def generate_fraud_call_script(self, facts: dict) -> dict | None:
        """Produce a short, grounded phone script from structured facts only.

        Returns dict with keys: opening_line, verification_question, yes_ack, no_ack.
        Returns None if Gemini is not configured or generation fails.
        """
        if not settings.GEMINI_API_KEY:
            return None

        payload = json.dumps(facts, indent=2)
        prompt = f"""You write the exact words Vera will say on a LIVE PHONE CALL to verify a suspicious charge.

FACTS (use ONLY these; do not invent merchants, amounts, or reasons):
{payload}

Return ONLY valid JSON with this shape (no markdown):
{{
  "opening_line": "One sentence greeting + name + VeraFund + the exact dollar amount and merchant from facts.",
  "verification_question": "One short question asking if they authorized THIS charge only.",
  "yes_ack": "One sentence if they confirm (approve this charge, thanks, goodbye).",
  "no_ack": "One sentence if they deny (freeze card, flag for review)."
}}
Rules: Mention the dollar amount and merchant name in opening_line. Stay under 40 words per string."""

        try:
            response = await _call_with_retry(lambda: self.model.generate_content_async(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=2048,
                    response_mime_type="application/json",
                ),
            ))
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            return json.loads(text)
        except Exception as exc:
            logger.warning("generate_fraud_call_script failed: %s", exc)
            return None


    async def summarize_advisor_call(self, transcript: str, context: dict) -> dict | None:
        """Summarize an advisor phone call transcript, extracting key topics,
        next steps, and any user-consented action requests.

        Returns dict with: summary, key_topics, next_steps, action_requests, safety_flags.
        Returns None if Gemini is unavailable or generation fails.
        """
        if not settings.GEMINI_API_KEY:
            return None

        context_text = context.get("context_text", "No financial context available.")
        user_name = context.get("user_name", "the user")

        prompt = f"""You are analyzing a completed phone call between Vera (AI financial advisor)
and {user_name}. The call was a personalized financial coaching session.

FINANCIAL CONTEXT AT TIME OF CALL:
{context_text}

CALL TRANSCRIPT:
{transcript}

Produce a structured summary. Return ONLY valid JSON (no markdown, no code fences):
{{
  "summary": "3-5 sentence personalized recap citing specific dollar amounts discussed. What was the main concern? What did Vera recommend? What did the user decide?",
  "key_topics": ["array of 2-5 topic tags, e.g. 'budget_pacing', 'subscriptions', 'savings_goal', 'debt_paydown', 'dining_spend'"],
  "next_steps": [
    "Up to 3 concrete action items with specific amounts or timelines, e.g. 'Reduce dining spend by $150 this week', 'Review Netflix subscription ($15.99/mo) in app'"
  ],
  "action_requests": [
    {{
      "type": "freeze_card | cancel_subscription | set_alert | adjust_budget",
      "target_name": "name of card, subscription, or category",
      "user_consent_quote": "exact words the user said to approve this action, or empty string if no explicit consent",
      "confidence": "high | medium | low — high only if user said clear yes/go ahead"
    }}
  ],
  "safety_flags": ["array of any ambiguous phrases or risky requests detected, empty array if none"]
}}

RULES:
- summary must reference at least 2 specific dollar amounts from the conversation.
- action_requests must be empty array if the user never explicitly approved any action.
- confidence is "high" ONLY if the transcript contains phrases like "yes", "do it", "go ahead", "freeze it now".
- If the user said "maybe", "I'll think about it", "not sure" — set confidence to "low" and add to safety_flags.
- next_steps should be actionable and specific, not generic advice."""

        try:
            response = await _call_with_retry(lambda: self.model.generate_content_async(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=4096,
                    response_mime_type="application/json",
                ),
            ))
            result = _parse_json_response(response.text)
            if not result:
                logger.warning("Advisor call summary parse failed: %s", response.text[:300])
                return None
            return result
        except Exception as exc:
            logger.warning("summarize_advisor_call failed: %s", exc)
            return None


gemini_service = GeminiService()
