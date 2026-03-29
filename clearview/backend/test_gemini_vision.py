"""Quick diagnostic: test Gemini vision extraction with and without JSON mode."""
import asyncio
import json
import google.generativeai as genai
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

PROMPT = (
    'Analyze this image and extract the product and its price. '
    'Return ONLY valid JSON with no other text, markdown, or code fences: '
    '{"product": "exact product name", "price": 00.00, "currency": "USD"} '
    'Rules: If the price is clearly visible, use the exact price. '
    'If no price is visible, estimate the typical retail price. '
    'If multiple products, pick the most prominent one. '
    'Always return valid JSON. Nothing else.'
)


async def main():
    model_name = settings.GEMINI_MODEL
    print(f"Model: {model_name}")
    print(f"API Key: {settings.GEMINI_API_KEY[:10]}...")
    model = genai.GenerativeModel(model_name)

    # Test 1: Basic text JSON (no vision)
    print("\n=== Test 1: Text-only JSON request ===")
    try:
        r = await model.generate_content_async(
            'Return JSON: {"test": true, "model": "working"}',
            generation_config=genai.GenerationConfig(temperature=0.1, max_output_tokens=100),
        )
        print(f"Raw: {repr(r.text[:300])}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

    # Test 2: Text JSON with response_mime_type
    print("\n=== Test 2: Text JSON with response_mime_type ===")
    try:
        r = await model.generate_content_async(
            'Return JSON: {"test": true, "model": "working"}',
            generation_config=genai.GenerationConfig(
                temperature=0.1, max_output_tokens=100,
                response_mime_type="application/json",
            ),
        )
        print(f"Raw: {repr(r.text[:300])}")
        parsed = json.loads(r.text)
        print(f"Parsed OK: {parsed}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

    # Test 3: Vision with a generated test image (simple colored square)
    print("\n=== Test 3: Vision extraction (PIL Image) ===")
    try:
        import PIL.Image
        import io
        # Create a simple test image with text
        img = PIL.Image.new("RGB", (200, 200), color=(255, 255, 255))
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        draw.text((10, 80), "Bread $2.57", fill=(0, 0, 0))

        r = await model.generate_content_async(
            [PROMPT, img],
            generation_config=genai.GenerationConfig(temperature=0.1, max_output_tokens=300),
        )
        print(f"Raw: {repr(r.text[:500])}")
        try:
            parsed = json.loads(r.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip())
            print(f"Parsed OK: {parsed}")
        except json.JSONDecodeError:
            print("JSON parse failed on raw text")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

    # Test 4: Vision + response_mime_type
    print("\n=== Test 4: Vision + response_mime_type (JSON mode) ===")
    try:
        import PIL.Image
        from PIL import ImageDraw
        img = PIL.Image.new("RGB", (200, 200), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.text((10, 80), "Bread $2.57", fill=(0, 0, 0))

        r = await model.generate_content_async(
            [PROMPT, img],
            generation_config=genai.GenerationConfig(
                temperature=0.1, max_output_tokens=300,
                response_mime_type="application/json",
            ),
        )
        print(f"Raw: {repr(r.text[:500])}")
        parsed = json.loads(r.text)
        print(f"Parsed OK: {parsed}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

    # Test 5: Check if model supports the features
    print("\n=== Test 5: Model info ===")
    try:
        info = genai.get_model(f"models/{model_name}")
        print(f"Display name: {info.display_name}")
        print(f"Supported methods: {info.supported_generation_methods}")
        print(f"Input token limit: {info.input_token_limit}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")


asyncio.run(main())
