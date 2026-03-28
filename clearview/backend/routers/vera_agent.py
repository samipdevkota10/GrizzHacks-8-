"""Vera agent router — call status, resolution, and history."""

from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from database import get_database
from objectid_util import parse_user_object_id

router = APIRouter(prefix="/api/vera", tags=["vera-agent"])


def _serialize(doc: dict) -> dict:
    if doc is None:
        return {}
    out = dict(doc)
    for k, v in out.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
    return out


@router.post("/call-result")
async def record_call_result(body: dict):
    """Record the outcome of a Vera fraud-verification call.

    Body fields:
        fraud_alert_id (str, required)
        resolution (str, required) — "user_confirmed" | "user_denied" | "no_answer"
    """
    alert_id = body.get("fraud_alert_id")
    resolution = body.get("resolution")

    if not alert_id or not resolution:
        raise HTTPException(400, "fraud_alert_id and resolution are required")
    if resolution not in ("user_confirmed", "user_denied", "no_answer"):
        raise HTTPException(400, "resolution must be user_confirmed, user_denied, or no_answer")

    db = get_database()
    alert = await db.fraud_alerts.find_one({"_id": ObjectId(alert_id)})
    if not alert:
        raise HTTPException(404, "Fraud alert not found")

    now = datetime.utcnow()

    await db.fraud_alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {
            "status": "resolved",
            "resolution": resolution,
            "call_resolved_at": now,
        }},
    )

    tx_id = alert.get("transaction_id")
    if resolution == "user_confirmed":
        if tx_id:
            await db.transactions.update_one(
                {"_id": tx_id if isinstance(tx_id, ObjectId) else ObjectId(tx_id)},
                {"$set": {"status": "approved", "anomaly_flag": False}},
            )
        return {"message": "Transaction confirmed by user. Approved."}

    elif resolution == "user_denied":
        if tx_id:
            await db.transactions.update_one(
                {"_id": tx_id if isinstance(tx_id, ObjectId) else ObjectId(tx_id)},
                {"$set": {"status": "denied"}},
            )

        if alert.get("virtual_card_id"):
            card_id = alert["virtual_card_id"]
            await db.virtual_cards.update_one(
                {"_id": card_id if isinstance(card_id, ObjectId) else ObjectId(card_id)},
                {"$set": {"status": "frozen", "paused_at": now}},
            )

        await db.notifications.insert_one({
            "user_id": alert["user_id"],
            "type": "fraud_denied",
            "title": f"Suspicious charge at {alert['merchant_name']} blocked",
            "message": (
                f"A charge of ${abs(alert['amount']):,.2f} at {alert['merchant_name']} "
                "was denied and the card has been frozen."
            ),
            "is_read": False,
            "related_entity_type": "fraud_alert",
            "related_entity_id": alert_id,
            "created_at": now,
        })
        return {"message": "Transaction denied. Card frozen and flagged for review."}

    else:
        return {"message": "No answer recorded. Alert remains open for follow-up."}


@router.get("/alerts/{user_id}")
async def get_fraud_alerts(user_id: str):
    """List all fraud alerts for a user, most recent first."""
    db = get_database()
    uid = parse_user_object_id(user_id)
    alerts = await db.fraud_alerts.find({"user_id": uid}).sort("created_at", -1).to_list(50)
    return {"fraud_alerts": [_serialize(a) for a in alerts]}


@router.get("/alert/{alert_id}")
async def get_fraud_alert(alert_id: str):
    """Get a single fraud alert by ID."""
    db = get_database()
    alert = await db.fraud_alerts.find_one({"_id": ObjectId(alert_id)})
    if not alert:
        raise HTTPException(404, "Fraud alert not found")
    return _serialize(alert)
