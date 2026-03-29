"""Check what the transactions API returns for the demo user."""
import requests

BACKEND = "https://grizzhacks-8-production.up.railway.app"
USER_ID = "69c8872cbab93b1d2a3387c0"

# 1. Hit the transactions endpoint directly
print("Testing GET /api/transactions/{user_id}...")
resp = requests.get(f"{BACKEND}/api/transactions/{USER_ID}", timeout=15)
print(f"  Status: {resp.status_code}")
data = resp.json()
txns = data.get("transactions", [])
print(f"  Transactions returned: {len(txns)}")
if txns:
    for tx in txns[:3]:
        print(f"    - {tx.get('merchant_name')} ${tx.get('amount')} status={tx.get('status')}")

# 2. Hit the dashboard endpoint and compare
print()
print("Testing GET /api/dashboard/{user_id}...")
resp2 = requests.get(f"{BACKEND}/api/dashboard/{USER_ID}", timeout=15)
print(f"  Status: {resp2.status_code}")
data2 = resp2.json()
recent = data2.get("recent_transactions", [])
print(f"  Recent transactions in dashboard: {len(recent)}")
if recent:
    for tx in recent[:3]:
        print(f"    - {tx.get('merchant_name')} ${tx.get('amount')} status={tx.get('status')}")
