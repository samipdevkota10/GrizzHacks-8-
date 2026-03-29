from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from config import settings
from database import get_database
from services.auth_service import get_current_user
from services.recurring_detection import detect_recurring_subscriptions

router = APIRouter(prefix="/api/plaid", tags=["plaid"])


def _plaid_base() -> str:
    env = (settings.PLAID_ENV or "sandbox").lower()
    if env == "production":
        return "https://production.plaid.com"
    return "https://sandbox.plaid.com"


def _require_plaid() -> None:
    if not settings.PLAID_CLIENT_ID or not settings.PLAID_SECRET:
        raise HTTPException(503, "Plaid is not configured on the server.")


async def _plaid_post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    _require_plaid()
    body = {
        "client_id": settings.PLAID_CLIENT_ID,
        "secret": settings.PLAID_SECRET,
        **payload,
    }
    async with httpx.AsyncClient(timeout=40) as client:
        res = await client.post(f"{_plaid_base()}{path}", json=body)
    if res.status_code >= 400:
        detail = res.json() if "application/json" in res.headers.get("content-type", "") else {"message": res.text}
        raise HTTPException(400, {"plaid_error": detail})
    return res.json()


def _map_account_type(acct: dict[str, Any]) -> str:
    at = (acct.get("type") or "").lower()
    st = (acct.get("subtype") or "").lower()
    if at == "depository" and st == "checking":
        return "checking"
    if at == "depository" and st == "savings":
        return "savings"
    if at == "credit":
        return "credit"
    if at == "investment":
        return "investment"
    return "other"


async def _sync_accounts_and_transactions(user_oid: ObjectId, access_token: str, institution_name: str | None = None) -> dict[str, int]:
    db = get_database()

    # Accounts
    accounts_resp = await _plaid_post("/accounts/get", {"access_token": access_token})
    plaid_accounts = accounts_resp.get("accounts", [])
    imported_accounts = 0
    for acct in plaid_accounts:
        account_type = _map_account_type(acct)
        doc = {
            "user_id": user_oid,
            "name": acct.get("name") or "Linked Account",
            "type": account_type,
            "balance": float((acct.get("balances") or {}).get("current") or 0),
            "currency": (acct.get("balances") or {}).get("iso_currency_code") or "USD",
            "institution_name": institution_name or "Linked Bank",
            "institution_logo_url": None,
            "is_primary_checking": account_type == "checking",
            "color": "#4F8EF7" if account_type != "credit" else "#FF4757",
            "is_active": True,
            "source": "plaid",
            "plaid_account_id": acct.get("account_id"),
            "last_synced": datetime.now(UTC).replace(tzinfo=None),
        }
        await db.accounts.update_one(
            {"user_id": user_oid, "plaid_account_id": acct.get("account_id")},
            {"$set": doc, "$setOnInsert": {"_id": ObjectId(), "created_at": datetime.now(UTC).replace(tzinfo=None)}},
            upsert=True,
        )
        imported_accounts += 1

    # Transactions (last 90 days)
    now = datetime.now(UTC)
    start = now - timedelta(days=90)
    tx_resp = await _plaid_post(
        "/transactions/get",
        {
            "access_token": access_token,
            "start_date": start.date().isoformat(),
            "end_date": now.date().isoformat(),
            "options": {"count": 500, "offset": 0},
        },
    )
    txs = tx_resp.get("transactions", [])
    imported_transactions = 0
    for tx in txs:
        tx_id = tx.get("transaction_id")
        if not tx_id:
            continue
        tx_date = datetime.fromisoformat(tx["date"]).replace(hour=12, minute=0, second=0, microsecond=0)
        amt = float(tx.get("amount") or 0)
        signed_amount = -amt if amt > 0 else amt
        category = (tx.get("personal_finance_category") or {}).get("primary", "other").lower()
        merchant = tx.get("merchant_name") or tx.get("name") or "Unknown merchant"
        doc = {
            "user_id": user_oid,
            "account_id": None,
            "virtual_card_id": None,
            "amount": signed_amount,
            "currency": tx.get("iso_currency_code") or "USD",
            "merchant_name": merchant,
            "merchant_logo_url": None,
            "category": category,
            "subcategory": None,
            "description": tx.get("name"),
            "date": tx_date,
            "is_recurring": False,
            "anomaly_flag": False,
            "anomaly_alert_id": None,
            "tags": ["plaid"],
            "ai_summary": None,
            "solana_receipt_tx": None,
            "created_at": tx_date,
            "source": "plaid",
            "plaid_transaction_id": tx_id,
        }
        await db.transactions.update_one(
            {"user_id": user_oid, "plaid_transaction_id": tx_id},
            {"$set": doc, "$setOnInsert": {"_id": ObjectId()}},
            upsert=True,
        )
        imported_transactions += 1

    # Recurring detection -> subscriptions collection
    recent = await db.transactions.find({"user_id": user_oid}).sort("date", -1).to_list(1000)
    recurring = detect_recurring_subscriptions(recent)
    for sub in recurring:
        await db.subscriptions.update_one(
            {"user_id": user_oid, "name": sub["name"], "billing_cycle": sub["billing_cycle"]},
            {
                "$set": {
                    "virtual_card_id": None,
                    "logo_url": None,
                    "amount": sub["amount"],
                    "next_billing_date": sub["next_billing_date"],
                    "category": sub["category"],
                    "status": "active",
                    "usage_score": sub["usage_score"],
                    "ai_cancel_recommendation": sub["ai_cancel_recommendation"],
                    "last_known_amount": sub["amount"],
                    "confidence": sub["confidence"],
                    "updated_at": datetime.now(UTC).replace(tzinfo=None),
                    "source": "plaid-detected",
                },
                "$setOnInsert": {
                    "_id": ObjectId(),
                    "user_id": user_oid,
                    "name": sub["name"],
                    "billing_cycle": sub["billing_cycle"],
                    "price_history": [],
                    "created_at": datetime.now(UTC).replace(tzinfo=None),
                },
            },
            upsert=True,
        )

    return {
        "accounts_imported": imported_accounts,
        "transactions_imported": imported_transactions,
        "subscriptions_detected": len(recurring),
    }


@router.post("/sandbox/bootstrap")
async def sandbox_bootstrap(user_id: str = Depends(get_current_user)):
    """
    End-to-end sandbox bootstrap without frontend Link dependency:
    - Create sandbox public_token
    - Exchange to access_token
    - Seed recurring transactions
    - Sync accounts + transactions into Mongo
    """
    db = get_database()
    uid = ObjectId(user_id)

    pub = await _plaid_post(
        "/sandbox/public_token/create",
        {
            "institution_id": "ins_109508",
            "initial_products": [p.strip() for p in settings.PLAID_PRODUCTS.split(",") if p.strip()],
            "options": {"webhook": settings.BACKEND_PUBLIC_URL.rstrip("/") + "/api/plaid/webhook" if settings.BACKEND_PUBLIC_URL else None},
        },
    )
    public_token = pub.get("public_token")
    if not public_token:
        raise HTTPException(400, "Failed to bootstrap Plaid sandbox token.")

    exch = await _plaid_post("/item/public_token/exchange", {"public_token": public_token})
    access_token = exch["access_token"]
    item_id = exch["item_id"]

    await _plaid_post(
        "/sandbox/transactions/create",
        {
            "access_token": access_token,
            "start_date": (datetime.now(UTC) - timedelta(days=120)).date().isoformat(),
            "end_date": datetime.now(UTC).date().isoformat(),
        },
    )

    # Persist plaid item
    await db.plaid_items.update_one(
        {"user_id": uid, "item_id": item_id},
        {
            "$set": {
                "access_token": access_token,
                "environment": settings.PLAID_ENV,
                "updated_at": datetime.now(UTC).replace(tzinfo=None),
            },
            "$setOnInsert": {"_id": ObjectId(), "user_id": uid, "item_id": item_id, "created_at": datetime.now(UTC).replace(tzinfo=None)},
        },
        upsert=True,
    )

    result = await _sync_accounts_and_transactions(uid, access_token, institution_name="First Platypus Bank")
    return {"status": "ok", "item_id": item_id, **result}


@router.post("/sync")
async def sync_plaid(user_id: str = Depends(get_current_user)):
    db = get_database()
    uid = ObjectId(user_id)
    item = await db.plaid_items.find_one({"user_id": uid}, sort=[("updated_at", -1)])
    if not item:
        raise HTTPException(404, "No Plaid item found. Connect bank first.")
    result = await _sync_accounts_and_transactions(uid, item["access_token"], institution_name=item.get("institution_name"))
    return {"status": "ok", **result}
