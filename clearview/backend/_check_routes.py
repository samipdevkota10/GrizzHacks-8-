"""Check which routes are actually registered on Railway."""
import requests

BACKEND = "https://grizzhacks-8-production.up.railway.app"

resp = requests.get(f"{BACKEND}/openapi.json", timeout=15)
data = resp.json()
paths = list(data.get("paths", {}).keys())

print("Registered routes:")
for p in sorted(paths):
    print(f"  {p}")
