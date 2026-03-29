"""Test the actual purchase-check endpoint flow by simulating a real upload."""
import asyncio
import io
import json
import httpx
import PIL.Image
from PIL import ImageDraw


async def main():
    # Create a realistic test image with a product and price
    img = PIL.Image.new("RGB", (400, 300), color=(245, 240, 230))
    draw = ImageDraw.Draw(img)
    draw.rectangle([(20, 20), (380, 280)], outline=(0, 0, 0), width=2)
    draw.text((50, 50), "Walmart", fill=(0, 100, 200))
    draw.text((50, 100), "Fresh Baked Bread", fill=(50, 50, 50))
    draw.text((50, 150), "Low Price", fill=(200, 0, 0))
    draw.text((50, 180), "$2.57", fill=(0, 0, 0))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    image_bytes = buf.read()
    print(f"Test image size: {len(image_bytes)} bytes")

    # Test 1: Direct call through the actual endpoint
    print("\n=== Test 1: POST /api/advisor/purchase-check ===")
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            files = {"image": ("test.png", image_bytes, "image/png")}
            data = {"user_id": "69c8872cbab93b1d2a3387c0"}
            r = await client.post(
                "http://localhost:8000/api/advisor/purchase-check",
                files=files,
                data=data,
            )
            print(f"Status: {r.status_code}")
            if r.status_code == 200:
                result = r.json()
                print(f"Product: {result.get('product')}")
                print(f"Price: {result.get('price')}")
                print(f"Verdict: {result.get('verdict')}")
                print(f"Hours: {result.get('hours_of_work')}")
                print(f"Reasoning: {result.get('reasoning', '')[:200]}")
            else:
                print(f"Error: {r.text[:500]}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

    # Test 2: Direct vision check with the same service
    print("\n=== Test 2: Direct GeminiService.purchase_vision_check ===")
    try:
        from services.gemini_service import gemini_service
        from services.financial_context import build_financial_context

        buf.seek(0)
        context = await build_financial_context("69c8872cbab93b1d2a3387c0")
        result = await gemini_service.purchase_vision_check(image_bytes, context)
        print(f"Product: {result.get('product')}")
        print(f"Price: {result.get('price')}")
        print(f"Verdict: {result.get('verdict')}")
        print(f"Full result: {json.dumps(result, indent=2)[:500]}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()


asyncio.run(main())
