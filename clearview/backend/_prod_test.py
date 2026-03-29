import asyncio, httpx, json

RAILWAY_URL = "https://grizzhacks-8-production.up.railway.app"

async def test():
    async with httpx.AsyncClient(timeout=15) as c:
        # 1. Check if advisor call routes exist on production
        r = await c.get(f"{RAILWAY_URL}/openapi.json")
        paths = r.json()["paths"]
        advisor_paths = [p for p in paths if "advisor" in p]
        print("=== Advisor routes on Railway ===")
        for p in advisor_paths:
            print(f"  {p}")

        has_call_start = "/api/advisor/call/start" in paths
        print(f"\n/api/advisor/call/start exists: {has_call_start}")

        if not has_call_start:
            print("ERROR: call/start route missing - Railway needs redeploy")
            return

        # 2. Try calling with a fake user to see error handling
        print("\n=== Testing POST /api/advisor/call/start (fake user) ===")
        r2 = await c.post(
            f"{RAILWAY_URL}/api/advisor/call/start",
            json={"user_id": "000000000000000000000000"}
        )
        print(f"Status: {r2.status_code}")
        try:
            print(f"Body: {json.dumps(r2.json(), indent=2)}")
        except Exception:
            print(f"Raw: {r2.text[:500]}")

        # 3. Check CORS headers
        print("\n=== Testing CORS (Vercel origin) ===")
        r3 = await c.options(
            f"{RAILWAY_URL}/api/advisor/call/start",
            headers={
                "Origin": "https://grizz-hacks-8.vercel.app",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,authorization",
            }
        )
        print(f"CORS preflight status: {r3.status_code}")
        for h in ["access-control-allow-origin", "access-control-allow-methods", "access-control-allow-headers"]:
            print(f"  {h}: {r3.headers.get(h, 'NOT SET')}")

asyncio.run(test())
