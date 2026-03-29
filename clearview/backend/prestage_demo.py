"""
Pre-stage demo data for GrizzHacks 8 presentation.

Run this ONCE before the hackathon demo to:
1. Re-seed the demo user (Alex Chen) with fresh realistic data
2. Trigger 2 fraud tests so the Vera Activity timeline has entries
3. Mark those fraud alerts as resolved (deny flow)

Usage:
  python prestage_demo.py --env prod   # runs against Railway production
  python prestage_demo.py --env local  # runs against localhost:8000
"""
import argparse
import asyncio
import sys
import time
import urllib.request
import urllib.parse
import json

PROD_URL = "https://grizzhacks-8-production.up.railway.app"
LOCAL_URL = "http://localhost:8000"


def request(url: str, method: str = "GET", data: dict | None = None, token: str | None = None) -> dict:
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode(errors="replace")
        print(f"  HTTP {e.code}: {body_text[:200]}")
        return {}
    except Exception as exc:
        print(f"  Error: {exc}")
        return {}


def step(msg: str):
    print(f"\n{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--env", choices=["prod", "local"], default="prod")
    args = parser.parse_args()

    base = PROD_URL if args.env == "prod" else LOCAL_URL
    print(f"\nVeraFund Pre-Demo Staging Script")
    print(f"Target: {base}")

    # ── 1. Seed the database ──────────────────────────────────────
    step("1. Seeding demo data")
    res = request(f"{base}/api/admin/seed", method="POST")
    if res:
        print(f"  Seed result: {json.dumps(res, indent=2)[:300]}")
    else:
        print("  Seed may have failed or returned empty — continuing anyway")

    time.sleep(2)

    # ── 2. Login to get token ─────────────────────────────────────
    step("2. Logging in as demo user")
    login = request(f"{base}/api/auth/login", method="POST", data={
        "email": "alex.chen@university.edu",
        "password": "demo1234"
    })
    token = login.get("access_token")
    if not token:
        print("  Login failed. Check credentials or seed first.")
        sys.exit(1)
    print(f"  Token acquired: {token[:30]}...")

    # ── 3. Verify dashboard loads ─────────────────────────────────
    step("3. Checking dashboard loads cleanly")
    dash = request(f"{base}/api/dashboard", token=token)
    ms = dash.get("monthly_summary", {})
    print(f"  Monthly income: ${ms.get('income', 0):,.2f}")
    print(f"  Monthly spend:  ${ms.get('spent', 0):,.2f}")
    txns = dash.get("recent_transactions", [])
    print(f"  Recent transactions: {len(txns)}")
    alerts = dash.get("fraud_alerts", [])
    resolved = [a for a in alerts if a.get("status") == "resolved"]
    active = [a for a in alerts if a.get("status") != "resolved"]
    print(f"  Fraud alerts: {len(active)} active, {len(resolved)} resolved")

    # ── 4. Trigger fraud test (produces a real call + resolved alert after) ──
    step("4. Triggering fraud test to populate Vera Activity timeline")
    if len(resolved) >= 2:
        print("  Already have 2+ resolved alerts. Skipping new trigger to avoid spamming calls.")
    else:
        print("  Triggering test fraud event (this will initiate a call — DECLINE IT on the phone)...")
        res = request(f"{base}/api/admin/test-fraud", method="POST", token=token)
        print(f"  Result: {json.dumps(res, indent=2)[:300]}")
        print("\n  ==> ANSWER YOUR PHONE AND SAY 'NO' TO COMPLETE THE FRAUD FLOW <==")
        print("  Waiting 60 seconds for call to complete...")
        for i in range(6):
            time.sleep(10)
            print(f"  ... {(i+1)*10}s elapsed")

    # ── 5. Final state check ──────────────────────────────────────
    step("5. Final state verification")
    dash2 = request(f"{base}/api/dashboard", token=token)
    alerts2 = dash2.get("fraud_alerts", [])
    resolved2 = [a for a in alerts2 if a.get("status") == "resolved"]
    print(f"  Resolved alerts in Vera Activity timeline: {len(resolved2)}")
    for a in resolved2[:3]:
        print(f"    - ${abs(a.get('amount', 0)):,.2f} at {a.get('merchant_name')} — {a.get('resolution')}")

    step("Done! Dashboard is ready for demo.")
    print("  Next steps:")
    print("  1. Open https://grizz-hacks-8.vercel.app/dashboard")
    print("  2. Log in: alex.chen@university.edu / demo1234")
    print("  3. Verify Vera Activity timeline shows blocked transactions")
    print("  4. Open AI Advisor and ask 'How am I doing this month?'")
    print("  5. You're ready. GO WIN.\n")


if __name__ == "__main__":
    main()
