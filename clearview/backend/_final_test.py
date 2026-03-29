import asyncio, httpx, json

RAILWAY = "https://grizzhacks-8-production.up.railway.app"

async def main():
    async with httpx.AsyncClient(timeout=30) as c:
        # 1. Login with demo user
        print("=== Login with demo user ===")
        r = await c.post(f"{RAILWAY}/api/auth/login", json={
            "email": "alex@verafunddemo.com",
            "password": "demo123"
        })
        print(f"Status: {r.status_code}")
        if r.status_code != 200:
            print(f"Body: {r.text[:300]}")
            return
        data = r.json()
        uid = data["user_id"]
        token = data["token"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        print(f"User ID: {uid}")

        # 2. Check dashboard has data
        print("\n=== Dashboard data ===")
        r2 = await c.get(f"{RAILWAY}/api/dashboard/{uid}", headers=headers)
        if r2.status_code == 200:
            dash = r2.json()
            user = dash.get("user", {})
            ms = dash.get("monthly_summary", {})
            qs = dash.get("quick_stats", {})
            print(f"  Name: {user.get('name')}")
            print(f"  Phone: {user.get('phone_number')}")
            print(f"  Budget: ${ms.get('budget', 0):,.2f}")
            print(f"  Spent: ${ms.get('spent', 0):,.2f}")
            print(f"  Income: ${ms.get('income', 0):,.2f}")
            print(f"  Top category: {qs.get('top_category')} (${qs.get('top_category_amount', 0):,.2f})")
            print(f"  Accounts: {len(dash.get('accounts', []))}")
            print(f"  Transactions: {len(dash.get('recent_transactions', []))}")
        else:
            print(f"  Status: {r2.status_code}: {r2.text[:300]}")

        # 3. Test voice session endpoint
        print("\n=== Voice session ===")
        r3 = await c.post(f"{RAILWAY}/api/advisor/voice-session", headers=headers, json={"user_id": uid})
        print(f"Status: {r3.status_code}")
        if r3.status_code == 200:
            vs = r3.json()
            print(f"  Signed URL: {vs['signed_url'][:60]}...")
            print(f"  Agent ID: {vs['agent_id']}")
            print(f"  First message preview: {vs['overrides']['agent']['firstMessage'][:120]}...")
            print(f"  Dynamic vars: {json.dumps(vs['dynamic_variables'], indent=2)}")
            print(f"\n  >>> VOICE SESSION READY <<<")
        else:
            body = r3.json()
            print(f"  Error: {json.dumps(body, indent=2)}")

asyncio.run(main())
