"""Test Gemini vision with the actual user's Walmart bread photo."""
import asyncio
import json
import io
import PIL.Image
import google.generativeai as genai
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

PROMPT = (
    'Analyze this image and extract the product and its price. '
    'Return ONLY valid JSON with no other text, markdown, or code fences: '
    '{"product": "exact product name", "price": 00.00, "currency": "USD"} '
    'Rules: '
    '- If the price is clearly visible, use the exact price. '
    '- If no price is visible, estimate the typical retail price for this product. '
    '- If the image shows multiple products, pick the most prominent one. '
    '- Always return valid JSON. Nothing else.'
)

IMG_PATH = r"D:\GrizzHacks-8-\Screenshot 2026-03-28 225958.png"


async def main():
    print(f"Model: {settings.GEMINI_MODEL}")

    img = PIL.Image.open(IMG_PATH)
    print(f"Image size: {img.size}, mode: {img.mode}, format: {img.format}")

    # Also read raw bytes (same way the endpoint does)
    with open(IMG_PATH, "rb") as f:
        raw_bytes = f.read()
    print(f"Raw file size: {len(raw_bytes)} bytes")

    # Reopen from bytes (same as endpoint flow)
    img_from_bytes = PIL.Image.open(io.BytesIO(raw_bytes))
    print(f"From bytes: {img_from_bytes.size}, mode: {img_from_bytes.mode}")

    model = genai.GenerativeModel(settings.GEMINI_MODEL)

    # Test 1: PIL Image opened from file path
    print("\n=== Test 1: PIL Image from file ===")
    try:
        r = await model.generate_content_async(
            [PROMPT, img],
            generation_config=genai.GenerationConfig(
                temperature=0.1, max_output_tokens=300,
                response_mime_type="application/json",
            ),
        )
        print(f"Raw response: {repr(r.text[:500])}")
        parsed = json.loads(r.text)
        print(f"Parsed: {json.dumps(parsed, indent=2)}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

    # Test 2: PIL Image opened from bytes (endpoint flow)
    print("\n=== Test 2: PIL Image from bytes (endpoint flow) ===")
    try:
        r = await model.generate_content_async(
            [PROMPT, img_from_bytes],
            generation_config=genai.GenerationConfig(
                temperature=0.1, max_output_tokens=300,
                response_mime_type="application/json",
            ),
        )
        print(f"Raw response: {repr(r.text[:500])}")
        parsed = json.loads(r.text)
        print(f"Parsed: {json.dumps(parsed, indent=2)}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

    # Test 3: Without response_mime_type
    print("\n=== Test 3: Without response_mime_type ===")
    try:
        r = await model.generate_content_async(
            [PROMPT, img_from_bytes],
            generation_config=genai.GenerationConfig(
                temperature=0.1, max_output_tokens=300,
            ),
        )
        print(f"Raw response: {repr(r.text[:500])}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

    # Test 4: Full endpoint simulation
    print("\n=== Test 4: Full purchase_vision_check flow ===")
    try:
        from services.gemini_service import gemini_service
        from services.financial_context import build_financial_context
        context = await build_financial_context("69c8872cbab93b1d2a3387c0")
        result = await gemini_service.purchase_vision_check(raw_bytes, context)
        print(f"Product: {result.get('product')}")
        print(f"Price: {result.get('price')}")
        print(f"Verdict: {result.get('verdict')}")
        print(f"Hours: {result.get('hours_of_work')}")
        print(f"Reasoning: {result.get('reasoning', '')[:300]}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()


asyncio.run(main())
