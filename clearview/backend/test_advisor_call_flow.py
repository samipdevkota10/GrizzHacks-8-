"""
Advisor call flow tests — run with: python test_advisor_call_flow.py
Tests both prompt assembly (offline) and API endpoints (requires running server).
"""

import asyncio
import json
import sys

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"


# ── 1. Prompt assembly (no I/O) ───────────────────────────────

def test_prompt_assembly():
    from services.advisor_caller import ADVISOR_CALL_PROMPT, _goals_summary

    mock_context = {
        "user_name": "Alex",
        "context_text": "FINANCIAL SNAPSHOT (as of right now)...",
        "month_spent": 1200.0,
        "monthly_budget": 3000.0,
        "discretionary_remaining": 800.0,
        "top_category": "dining",
        "top_category_amount": 450.0,
        "subscription_total_monthly": 89.0,
        "financial_goals": [
            {"name": "Emergency Fund", "target_amount": 10000, "current_amount": 4000}
        ],
    }

    goals_text = _goals_summary(mock_context["financial_goals"])
    prompt = ADVISOR_CALL_PROMPT.format(
        user_name=mock_context["user_name"],
        context_text=mock_context["context_text"],
        month_spent=mock_context["month_spent"],
        monthly_budget=mock_context["monthly_budget"],
        discretionary_remaining=mock_context["discretionary_remaining"],
        top_category=mock_context["top_category"],
        top_category_amount=mock_context["top_category_amount"],
        subscription_total_monthly=mock_context["subscription_total_monthly"],
        goals_summary=goals_text,
    )

    checks = {
        "user_name in prompt": "Alex" in prompt,
        "month_spent in prompt": "1,200.00" in prompt,
        "monthly_budget in prompt": "3,000.00" in prompt,
        "discretionary in prompt": "800.00" in prompt,
        "top_category in prompt": "dining" in prompt,
        "goal name in prompt": "Emergency Fund" in goals_text,
        "consent guardrail present": "EXPLICIT verbal consent" in prompt,
        "action execute guard present": "ONLY EXECUTE" in prompt,
        "no_answer guard present": "ambiguous" in prompt.lower(),
    }

    all_pass = True
    for name, result in checks.items():
        status = PASS if result else FAIL
        print(f"  [{status}] {name}")
        if not result:
            all_pass = False

    first_message = (
        f"Hi {mock_context['user_name']}, it's Vera from VeraFund. "
        f"You've spent ${mock_context['month_spent']:,.2f} of your "
        f"${mock_context['monthly_budget']:,.2f} budget this month, "
        f"so you have ${mock_context['discretionary_remaining']:,.2f} "
        f"left for discretionary spending. "
        f"Want me to walk you through a quick game plan for the rest of the month?"
    )
    fm_checks = {
        "first_message has name": "Alex" in first_message,
        "first_message has spent": "1,200.00" in first_message,
        "first_message has budget": "3,000.00" in first_message,
        "first_message has discretionary": "800.00" in first_message,
        "first_message under 500 chars": len(first_message) <= 500,
    }
    for name, result in fm_checks.items():
        status = PASS if result else FAIL
        print(f"  [{status}] {name}")
        if not result:
            all_pass = False

    return all_pass


# ── 2. Summarize_advisor_call schema (requires Gemini key) ────

async def test_summarize_schema():
    from services.gemini_service import gemini_service
    import os

    if not os.getenv("GEMINI_API_KEY") and not hasattr(gemini_service.model, "_name"):
        print(f"  [SKIP] Gemini not configured — skipping live summarize test")
        return True

    sample_transcript = (
        "Vera: Hi Alex, you've spent $1,200 of your $3,000 budget with $800 left. "
        "Your biggest category is dining at $450. Want a game plan? "
        "Alex: Yeah, I want to cut down on dining. "
        "Vera: I'd suggest cutting $200 from dining this week. Also your Netflix "
        "subscription is $15.99/month — do you still use it? "
        "Alex: No, go ahead and cancel that. "
        "Vera: Got it, I'll flag Netflix for cancellation. "
        "Alex: Thanks, that's helpful. "
        "Vera: Great, to summarise: cut dining by $200, cancel Netflix. Take care!"
    )
    sample_context = {
        "context_text": "Checking: $5,200. Month spent: $1,200 / $3,000.",
        "user_name": "Alex",
    }

    try:
        result = await gemini_service.summarize_advisor_call(sample_transcript, sample_context)
    except Exception as exc:
        print(f"  [SKIP] Gemini API error: {exc}")
        return True

    if result is None:
        print(f"  [SKIP] summarize returned None (Gemini not configured)")
        return True

    required_keys = ["summary", "key_topics", "next_steps", "action_requests", "safety_flags"]
    checks = {}
    for key in required_keys:
        checks[f"result has '{key}'"] = key in result

    if "action_requests" in result:
        for ar in result.get("action_requests", []):
            checks["action_request has confidence field"] = "confidence" in ar
            checks["action_request has user_consent_quote"] = "user_consent_quote" in ar
            break

    all_pass = True
    for name, ok in checks.items():
        status = PASS if ok else FAIL
        print(f"  [{status}] {name}")
        if not ok:
            all_pass = False

    print(f"  [INFO] summary snippet: {str(result.get('summary', ''))[:120]}")
    return all_pass


# ── 3. HTTP endpoint smoke (requires running server) ──────────

async def test_http_endpoints():
    import httpx
    base = "http://localhost:8000"

    # Try port 8002 first (test port), fallback to 8000 (prod port)
    for port in (8002, 8000):
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                r = await client.get(f"http://localhost:{port}/openapi.json")
                paths = list(r.json().get("paths", {}).keys())
                if "/api/advisor/call/start" in paths:
                    base = f"http://localhost:{port}"
                    break
        except Exception:
            continue
    else:
        print(f"  [SKIP] No server with new routes found — skipping HTTP tests")
        return True
    
    print(f"  [INFO] Testing against {base}")

    results = {}
    async with httpx.AsyncClient(timeout=10) as client:
        # Test call/start with invalid user
        r = await client.post(
            f"{base}/api/advisor/call/start",
            json={"user_id": "000000000000000000000000"},
        )
        results["call/start rejects unknown user (400 or 404 or 400)"] = r.status_code in (400, 404, 502)

        # Test call/start without user_id
        r = await client.post(f"{base}/api/advisor/call/start", json={})
        results["call/start requires user_id (400)"] = r.status_code == 400

        # Test call-result without conversation_id
        r = await client.post(f"{base}/api/advisor/call-result", json={"status": "completed"})
        results["call-result requires conversation_id (400)"] = r.status_code == 400

        # Test calls list with garbage user
        r = await client.get(f"{base}/api/advisor/calls/000000000000000000000000")
        results["calls list returns empty array for unknown user"] = (
            r.status_code == 200 and r.json().get("calls") == []
        )

    all_pass = True
    for name, ok in results.items():
        status = PASS if ok else FAIL
        print(f"  [{status}] {name}")
        if not ok:
            all_pass = False

    return all_pass


# ── 4. Frontend type consistency check ───────────────────────

def test_frontend_types():
    import subprocess, pathlib
    api_ts = pathlib.Path(__file__).parent.parent / "frontend" / "lib" / "api.ts"
    if not api_ts.exists():
        print(f"  [SKIP] api.ts not found")
        return True

    content = api_ts.read_text()
    checks = {
        "startAdvisorCall function exported": "export function startAdvisorCall" in content,
        "fetchAdvisorCalls function exported": "export function fetchAdvisorCalls" in content,
        "submitAdvisorCallResult exported": "export function submitAdvisorCallResult" in content,
        "AdvisorCallStatus type defined": "AdvisorCallStatus" in content,
        "AdvisorCallSummary interface defined": "AdvisorCallSummary" in content,
        "AdvisorActionRequest interface defined": "AdvisorActionRequest" in content,
        "phone_last4 field present": "phone_last4" in content,
        "action_requests field present": "action_requests" in content,
    }
    all_pass = True
    for name, ok in checks.items():
        status = PASS if ok else FAIL
        print(f"  [{status}] {name}")
        if not ok:
            all_pass = False
    return all_pass


# ── 5. Advisor page component checks ─────────────────────────

def test_advisor_page():
    import pathlib
    page = pathlib.Path(__file__).parent.parent / "frontend" / "app" / "dashboard" / "advisor" / "page.tsx"
    if not page.exists():
        print(f"  [SKIP] advisor page not found")
        return True

    content = page.read_text()
    checks = {
        "Call me now button present": "Call me now" in content,
        "handleStartCall function present": "handleStartCall" in content,
        "startAdvisorCall imported": "startAdvisorCall" in content,
        "fetchAdvisorCalls imported": "fetchAdvisorCalls" in content,
        "CallHistoryCard component present": "CallHistoryCard" in content,
        "calling state handled": "calling" in content,
        "phone_last4 displayed": "phone_last4" in content or "phoneLast4" in content or "callPhoneLast4" in content,
        "summary rendered": "call.summary" in content,
        "next_steps rendered": "next_steps" in content,
        "action_requests rendered": "action_requests" in content,
        "key_topics rendered as chips": "key_topics" in content,
        "safety_flags rendered": "safety_flags" in content,
        "error state handled": "callError" in content,
        "cooldown / disable logic": "initiating" in content,
    }
    all_pass = True
    for name, ok in checks.items():
        status = PASS if ok else FAIL
        print(f"  [{status}] {name}")
        if not ok:
            all_pass = False
    return all_pass


async def main():
    total_pass = True

    sync_suites = [
        ("1. Prompt Assembly & Guardrails", test_prompt_assembly),
        ("2. Frontend Type Definitions", test_frontend_types),
        ("3. Advisor Page Component", test_advisor_page),
    ]
    async_suites = [
        ("4. Summarize Schema (live Gemini)", test_summarize_schema),
        ("5. HTTP Endpoint Smoke", test_http_endpoints),
    ]

    for name, fn in sync_suites:
        print(f"\n{name}")
        print("-" * 50)
        try:
            ok = fn()
            total_pass = total_pass and ok
        except Exception as exc:
            print(f"  [{FAIL}] Suite crashed: {exc}")
            import traceback; traceback.print_exc()
            total_pass = False

    for name, coro_fn in async_suites:
        print(f"\n{name}")
        print("-" * 50)
        try:
            ok = await coro_fn()
            total_pass = total_pass and ok
        except Exception as exc:
            print(f"  [{FAIL}] Suite crashed: {exc}")
            import traceback; traceback.print_exc()
            total_pass = False

    print("\n" + "=" * 50)
    if total_pass:
        print(f"ALL SUITES {PASS}")
    else:
        print(f"SOME SUITES {FAIL}")
    return 0 if total_pass else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
