"""Quick check that GEMINI_API_KEY and GEMINI_MODEL work (reads backend/.env via config)."""
import sys

import google.generativeai as genai

from config import settings


def main() -> int:
    if not settings.GEMINI_API_KEY.strip():
        print("FAIL: GEMINI_API_KEY is empty in .env")
        return 1

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)

    try:
        response = model.generate_content(
            'Reply with exactly one word: "pong".',
            request_options={"timeout": 30},
        )
        text = (response.text or "").strip().lower()
        if not text:
            print("FAIL: Empty response from Gemini")
            return 1
        print(f"OK: model={settings.GEMINI_MODEL!r} response={text!r}")
        return 0
    except Exception as e:
        print(f"FAIL: {type(e).__name__}: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
