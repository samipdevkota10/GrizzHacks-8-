import asyncio, httpx, json

RAILWAY_URL = "https://grizzhacks-8-production.up.railway.app"

async def test():
    async with httpx.AsyncClient(timeout=15) as c:
        # Check all API routes that might list users
        print("=== Checking /api/users ===")
        r = await c.get(f"{RAILWAY_URL}/api/users")
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            print(f"Body: {r.text[:500]}")

        print("\n=== Checking /api/auth routes ===")
        r2 = await c.get(f"{RAILWAY_URL}/openapi.json")
        paths = r2.json()["paths"]
        auth_paths = [p for p in paths if "auth" in p or "user" in p.lower()]
        for p in auth_paths:
            methods = list(paths[p].keys())
            print(f"  {p} [{', '.join(methods)}]")

        # Try dashboard endpoint to find a user
        print("\n=== Try login to find user ===")
        # Check if there's a way to list users
        dash_paths = [p for p in paths if "dashboard" in p]
        for p in dash_paths:
            print(f"  {p}")

asyncio.run(test())
