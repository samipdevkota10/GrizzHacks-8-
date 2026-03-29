import asyncio, httpx, json

RAILWAY_URL = "https://grizzhacks-8-production.up.railway.app"

async def test():
    async with httpx.AsyncClient(timeout=15) as c:
        # Try to login with seed credentials
        print("=== Login with demo credentials ===")
        r = await c.post(
            f"{RAILWAY_URL}/api/auth/login",
            json={"email": "alex@verafunddemo.com", "password": "demo123"}
        )
        print(f"Status: {r.status_code}")
        body = r.json()
        print(f"Body: {json.dumps(body, indent=2)[:800]}")

        if r.status_code == 200:
            user_id = body.get("user_id")
            token = body.get("token")
            print(f"\nUser ID: {user_id}")

            # Now test advisor call with real user
            print("\n=== Test call/start with real user ===")
            r2 = await c.post(
                f"{RAILWAY_URL}/api/advisor/call/start",
                json={"user_id": user_id},
                headers={"Authorization": f"Bearer {token}"}
            )
            print(f"Status: {r2.status_code}")
            print(f"Body: {json.dumps(r2.json(), indent=2)[:800]}")

asyncio.run(test())
