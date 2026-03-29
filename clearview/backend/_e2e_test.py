"""End-to-end test of the advisor call flow against the Railway production server."""
import asyncio, httpx, json, time

RAILWAY = "https://grizzhacks-8-production.up.railway.app"

async def main():
    async with httpx.AsyncClient(timeout=30) as c:
        # Step 1: Sign up a test user (or login if exists)
        email = "e2etest@verafund.dev"
        password = "TestPass123!"

        print("=== Step 1: Create / login test user ===")
        r = await c.post(f"{RAILWAY}/api/auth/login", json={"email": email, "password": password})
        if r.status_code != 200:
            print("  Login failed, signing up...")
            r = await c.post(f"{RAILWAY}/api/auth/signup", json={
                "name": "E2E Test User",
                "email": email,
                "password": password,
            })
            print(f"  Signup status: {r.status_code}")
            if r.status_code != 200:
                print(f"  Signup body: {r.text[:500]}")
                return

        data = r.json()
        user_id = data["user_id"]
        token = data["token"]
        print(f"  User ID: {user_id}")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # Step 2: Check user profile
        print("\n=== Step 2: Check profile ===")
        r2 = await c.get(f"{RAILWAY}/api/auth/profile", headers=headers)
        if r2.status_code == 200:
            profile = r2.json()
            print(f"  Name: {profile.get('name')}")
            print(f"  Phone: {profile.get('phone_number', 'NOT SET')}")
            print(f"  Onboarding: {profile.get('onboarding_complete')}")

        # Step 3: Update phone if needed
        print("\n=== Step 3: Ensure phone number ===")
        r3 = await c.patch(
            f"{RAILWAY}/api/auth/profile",
            headers=headers,
            json={"phone_number": "+15713520115"}
        )
        print(f"  Profile update status: {r3.status_code}")
        if r3.status_code == 200:
            print(f"  Phone now set")
        else:
            print(f"  Response: {r3.text[:300]}")

        # Step 4: Try the advisor call
        print("\n=== Step 4: Initiate advisor call ===")
        r4 = await c.post(
            f"{RAILWAY}/api/advisor/call/start",
            headers=headers,
            json={"user_id": user_id}
        )
        print(f"  Status: {r4.status_code}")
        body = r4.json()
        print(f"  Response: {json.dumps(body, indent=2)}")

        if r4.status_code == 200 and body.get("success"):
            print("\n  >>> CALL INITIATED SUCCESSFULLY! <<<")
            print(f"  Conversation ID: {body.get('conversation_id')}")
            print(f"  Session ID: {body.get('session_id')}")
            print(f"  Phone last 4: {body.get('phone_last4')}")
        else:
            print("\n  >>> CALL FAILED <<<")
            detail = body.get("detail", body)
            if isinstance(detail, dict):
                print(f"  Error: {detail.get('message', 'unknown')}")
                print(f"  Code: {detail.get('code', 'unknown')}")
                print(f"  Hint: {detail.get('hint', 'none')}")

        # Step 5: Check call history
        print("\n=== Step 5: Call history ===")
        r5 = await c.get(f"{RAILWAY}/api/advisor/calls/{user_id}", headers=headers)
        print(f"  Status: {r5.status_code}")
        calls = r5.json().get("calls", [])
        print(f"  Total calls: {len(calls)}")
        for call in calls[:3]:
            print(f"    - {call.get('status')} | {call.get('started_at')} | last4={call.get('phone_last4')}")

asyncio.run(main())
