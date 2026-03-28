"""Transaction ingestion endpoint.

Accepts incoming transactions (simulating a Plaid webhook or manual demo
trigger), runs fraud detection, and initiates a Vera outbound call when
a transaction is flagged.
"""

from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, HTTPException

from database import get_database
from objectid_util import parse_user_object_id
from services.fraud_detection import evaluate_transaction
from services.vera_caller import initiate_fraud_call

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


def _serialize(doc: dict) -> dict:
    if doc is None:
        return {}
    out = dict(doc)
    for k, v in out.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
    return out


async def _handle_fraud_call(
    user_id: str,
    transaction_id: str,
    fraud_alert_id: str,
    amount: float,
    merchant_name: str,
    category: str,
    reason: str,
    severity: str,
) -> None:
    """Background task wrapper so the endpoint returns immediately."""
    try:
        await initiate_fraud_call(
            user_id=user_id,
            transaction_id=transaction_id,
            fraud_alert_id=fraud_alert_id,
            amount=amount,
            merchant_name=merchant_name,
            category=category,
            reason=reason,
            severity=severity,
        )
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("Fraud call failed: %s", exc, exc_info=True)


@router.post("/incoming")
async def ingest_transaction(body: dict, background_tasks: BackgroundTasks):
    """Receive a new transaction, score it, and optionally trigger a Vera call.

    Body fields:
        user_id (str, required)
        amount (float, required) — negative for charges
        merchant_name (str, required)
        category (str, default "other")
        account_id (str, optional) — defaults to primary checking
        virtual_card_id (str, optional)
        description (str, optional)
    """
    user_id = body.get("user_id")
    amount = body.get("amount")
    merchant_name = body.get("merchant_name")

    if not user_id or amount is None or not merchant_name:
        raise HTTPException(400, "user_id, amount, and merchant_name are required")

    db = get_database()
    uid = parse_user_object_id(user_id)
    category = body.get("category", "other")
    now = datetime.utcnow()

    if not body.get("account_id"):
        checking = await db.accounts.find_one({"user_id": uid, "is_primary_checking": True})
        account_id = str(checking["_id"]) if checking else ""
    else:
        account_id = body["account_id"]

    detection = await evaluate_transaction(
        user_id=user_id,
        amount=amount,
        merchant_name=merchant_name,
        category=category,
    )

    flagged = detection is not None
    tx_status = "pending_review" if flagged else "approved"

    tx_doc = {
        "_id": ObjectId(),
        "user_id": uid,
        "account_id": account_id,
        "virtual_card_id": body.get("virtual_card_id"),
        "amount": amount,
        "currency": body.get("currency", "USD"),
        "merchant_name": merchant_name,
        "merchant_logo_url": None,
        "category": category,
        "subcategory": None,
        "description": body.get("description"),
        "date": now,
        "is_recurring": False,
        "anomaly_flag": flagged,
        "anomaly_alert_id": None,
        "tags": [],
        "ai_summary": None,
        "solana_receipt_tx": None,
        "created_at": now,
        "status": tx_status,
    }
    await db.transactions.insert_one(tx_doc)
    tx_id = str(tx_doc["_id"])

    fraud_alert_id = None
    if flagged:
        alert_doc = {
            "_id": ObjectId(),
            "user_id": uid,
            "transaction_id": ObjectId(tx_id),
            "amount": amount,
            "merchant_name": merchant_name,
            "category": category,
            "reason": detection["reason"],
            "severity": detection["severity"],
            "status": "pending",
            "call_conversation_id": None,
            "call_sid": None,
            "call_initiated_at": None,
            "call_resolved_at": None,
            "resolution": None,
            "created_at": now,
        }
        await db.fraud_alerts.insert_one(alert_doc)
        fraud_alert_id = str(alert_doc["_id"])

        await db.transactions.update_one(
            {"_id": tx_doc["_id"]},
            {"$set": {"anomaly_alert_id": fraud_alert_id}},
        )

        background_tasks.add_task(
            _handle_fraud_call,
            user_id=user_id,
            transaction_id=tx_id,
            fraud_alert_id=fraud_alert_id,
            amount=amount,
            merchant_name=merchant_name,
            category=category,
            reason=detection["reason"],
            severity=detection["severity"],
        )

    return {
        "transaction_id": tx_id,
        "status": tx_status,
        "flagged": flagged,
        "fraud_alert_id": fraud_alert_id,
        "detection": detection,
    }


@router.get("/{user_id}")
async def list_transactions(user_id: str, limit: int = 50):
    db = get_database()
    uid = parse_user_object_id(user_id)
    txns = await db.transactions.find({"user_id": uid}).sort("date", -1).to_list(limit)
    return {"transactions": [_serialize(t) for t in txns]}
