#!/usr/bin/env python3
"""
MongoDB Atlas connectivity check. Run from clearview/backend:

  source venv/bin/activate
  pip install -r requirements.txt   # first time only
  python diagnose_mongo.py

Loads backend/.env via python-dotenv (does not import config.py).
Exit code 0 = ping succeeded; 1 = failed (see printed checklist).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConfigurationError, OperationFailure, ServerSelectionTimeoutError

_BACKEND_DIR = Path(__file__).resolve().parent


def main() -> int:
    env_path = _BACKEND_DIR / ".env"
    load_dotenv(env_path)
    uri = os.environ.get("MONGODB_URI", "").strip()
    db_name = os.environ.get("MONGODB_DB_NAME", "clearview_db").strip()

    print("=== Clearview MongoDB diagnostics ===\n")
    print(f"Env file: {env_path}")
    print(f"Database: {db_name}")

    if not uri:
        print("\nFAIL: MONGODB_URI is missing. Set it in backend/.env")
        print("  Tip: use the backend venv:  cd clearview/backend && source venv/bin/activate")
        return 1

    # Placeholder check (no secrets printed)
    bad = ("<cluster>", "<user>", "<password>")
    if any(b in uri for b in bad):
        print("\nFAIL: MONGODB_URI still contains README placeholders (<user>, <password>, or <cluster>).")
        print("  Fix: In Atlas → Connect → Drivers, copy the full connection string into backend/.env")
        return 1

    host_hint = uri.split("@")[-1].split("/")[0] if "@" in uri else "?"
    print(f"Cluster host (from URI): {host_hint}")

    print("\nAttempting ping (15s timeout)...")
    try:
        client = MongoClient(
            uri,
            serverSelectionTimeoutMS=15000,
            connectTimeoutMS=15000,
        )
        client.admin.command("ping")
        client.close()
        print("OK: MongoDB Atlas responded to ping.\n")
        return 0
    except ConfigurationError as e:
        print(f"\nFAIL: Bad connection string / DNS:\n  {e}\n")
        return 1
    except ServerSelectionTimeoutError as e:
        print(f"\nFAIL: Could not reach Atlas within timeout:\n  {e}\n")
        print("Checklist (most common first):")
        print("  1. Atlas → Network Access → add your current public IP, or 0.0.0.0/0 for dev only.")
        print("  2. Confirm the cluster is not paused (Atlas → Clusters → Resume if needed).")
        print("  3. If on school/corporate Wi‑Fi, try phone hotspot (port 27017 may be blocked).")
        print("  4. VPN: try disconnecting or another region.")
        return 1
    except OperationFailure as e:
        print(f"\nFAIL: Auth or command error (connection reached Atlas):\n  {e}\n")
        print("  Fix: Check database username/password in MONGODB_URI (URL-encode special chars in password).")
        return 1


if __name__ == "__main__":
    sys.exit(main())
