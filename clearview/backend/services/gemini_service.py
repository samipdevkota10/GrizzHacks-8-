import json
import logging
import google.generativeai as genai
from config import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)


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


VISION_EXTRACTION_PROMPT = """Analyze this image and extract the product and price.
Return ONLY valid JSON: {"product": "exact name", "price": 00.00, "currency": "USD"}.
If no price is visible, estimate based on product type.
Do not include any other text or markdown."""


PURCHASE_ADVICE_TEMPLATE = """The user is considering buying: {product} for ${price:.2f}

Their current financial situation:
- Discretionary budget remaining this month: ${discretionary_remaining:.2f}
- Upcoming bills in next 30 days: ${upcoming_bills:.2f}
- Checking balance: ${checking_balance:.2f}
- Already spent ${month_spent:.2f} of ${monthly_budget:.2f} budget.

Give a direct verdict first (YES / HOLD OFF / NO), then explain in 80 words max
using their specific numbers. Be honest even if uncomfortable."""


class GeminiService:
    def __init__(self):
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        self.vision_model = genai.GenerativeModel(settings.GEMINI_MODEL)

    async def chat(self, message: str, context: dict, history: list[dict] | None = None) -> str:
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(**context)
        
        contents = [{"role": "user", "parts": [{"text": system_prompt}]},
                     {"role": "model", "parts": [{"text": "Understood. I'm Vera, ready to help with your finances using your specific data."}]}]
        
        if history:
            for msg in history[-10:]:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg["content"]}]})
        
        contents.append({"role": "user", "parts": [{"text": message}]})
        
        response = await self.model.generate_content_async(
            contents,
            generation_config=genai.GenerationConfig(temperature=0.3, max_output_tokens=500)
        )
        return response.text

    async def purchase_vision_check(self, image_bytes: bytes, context: dict) -> dict:
        import PIL.Image
        import io
        
        image = PIL.Image.open(io.BytesIO(image_bytes))
        
        extraction_response = await self.vision_model.generate_content_async(
            [VISION_EXTRACTION_PROMPT, image],
            generation_config=genai.GenerationConfig(temperature=0.1, max_output_tokens=200)
        )
        
        try:
            text = extraction_response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            extracted = json.loads(text)
        except (json.JSONDecodeError, IndexError):
            extracted = {"product": "Unknown Product", "price": 0.0, "currency": "USD"}
        
        advice_prompt = PURCHASE_ADVICE_TEMPLATE.format(
            product=extracted.get("product", "Unknown"),
            price=extracted.get("price", 0),
            discretionary_remaining=context.get("discretionary_remaining", 0),
            upcoming_bills=context.get("upcoming_bills_30d", 0),
            checking_balance=context.get("checking_balance", 0),
            month_spent=context.get("month_spent", 0),
            monthly_budget=context.get("monthly_budget", 3500),
        )
        
        system = SYSTEM_PROMPT_TEMPLATE.format(**context)
        advice_response = await self.model.generate_content_async(
            [{"role": "user", "parts": [{"text": system}]},
             {"role": "model", "parts": [{"text": "Ready to evaluate this purchase."}]},
             {"role": "user", "parts": [{"text": advice_prompt}]}],
            generation_config=genai.GenerationConfig(temperature=0.3, max_output_tokens=300)
        )
        
        reasoning = advice_response.text.strip()
        verdict = "careful"
        lower = reasoning.lower()
        if lower.startswith("yes") or "verdict: yes" in lower:
            verdict = "yes"
        elif lower.startswith("no") or "verdict: no" in lower:
            verdict = "no"
        
        return {
            "product": extracted.get("product", "Unknown"),
            "price": extracted.get("price", 0),
            "currency": extracted.get("currency", "USD"),
            "verdict": verdict,
            "reasoning": reasoning,
        }

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
            response = await self.model.generate_content_async(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=400,
                    response_mime_type="application/json",
                ),
            )
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            return json.loads(text)
        except Exception as exc:
            logger.warning("generate_fraud_call_script failed: %s", exc)
            return None


gemini_service = GeminiService()
