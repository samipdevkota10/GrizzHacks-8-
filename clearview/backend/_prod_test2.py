import asyncio, httpx, json

RAILWAY_URL = "https://grizzhacks-8-production.up.railway.app"
USER_ID = "69c8872cbab93b1d2a3387c0"

async def test():
    async with httpx.AsyncClient(timeout=30) as c:
        # Test with the real user ID
        print("=== Testing call/start with real user ===")
        r = await c.post(
            f"{RAILWAY_URL}/api/advisor/call/start",
            json={"user_id": USER_ID}
        )
        print(f"Status: {r.status_code}")
        try:
            body = r.json()
            print(f"Body: {json.dumps(body, indent=2)}")
        except Exception:
            print(f"Raw: {r.text[:1000]}")

        # Also test fetching call history
        print("\n=== Testing GET /api/advisor/calls ===")
        r2 = await c.get(f"{RAILWAY_URL}/api/advisor/calls/{USER_ID}")
        print(f"Status: {r2.status_code}")
        try:
            body2 = r2.json()
            print(f"Calls count: {len(body2.get('calls', []))}")
        except Exception:
            print(f"Raw: {r2.text[:500]}")

asyncio.run(test())
