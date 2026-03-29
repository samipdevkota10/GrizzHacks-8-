import asyncio, httpx, json

async def test():
    base = "http://localhost:8003"
    async with httpx.AsyncClient(timeout=10) as c:
        # 1. Check routes exist
        r = await c.get(f"{base}/openapi.json")
        paths = [p for p in r.json()["paths"] if "advisor" in p]
        print("Advisor routes:", json.dumps(paths, indent=2))

        # 2. Get a user from the DB
        r2 = await c.get(f"{base}/api/users")
        data = r2.json()
        print(f"Users response type: {type(data).__name__}, keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
        if isinstance(data, dict):
            users = data.get("users", data.get("data", []))
        else:
            users = data
        if not users:
            print("No users in DB, using seed user_id=user_1")
            uid = "user_1"
            phone = "from .env"
        else:
            u = users[0] if isinstance(users, list) else users
            uid = u.get("_id") or u.get("id") or u.get("user_id")
            phone = u.get("phone_number", "NONE")
        print(f"User: {uid}, phone: {phone}")

        # 3. Try calling the start endpoint
        print("\n--- Testing POST /api/advisor/call/start ---")
        r3 = await c.post(
            f"{base}/api/advisor/call/start",
            json={"user_id": uid}
        )
        print(f"Status: {r3.status_code}")
        try:
            body = r3.json()
            print(f"Body: {json.dumps(body, indent=2)}")
        except Exception:
            print(f"Raw: {r3.text[:500]}")

asyncio.run(test())
