"""Subscriptions CRUD router."""

from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from database import get_database
from objectid_util import parse_user_object_id
from services.creep_detection import check_for_price_creep

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


def _serialize(doc: dict) -> dict:
    if doc is None:
        return {}
    out = dict(doc)
    for k, v in out.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
    return out


@router.get("/{user_id}")
async def list_subscriptions(user_id: str):
    db = get_database()
    uid = parse_user_object_id(user_id)
    subs = await db.subscriptions.find({"user_id": uid}).to_list(50)
    return {"subscriptions": [_serialize(s) for s in subs]}


@router.patch("/{sub_id}")
async def update_subscription(sub_id: str, body: dict):
    db = get_database()
    sub = await db.subscriptions.find_one({"_id": ObjectId(sub_id)})
    if not sub:
        raise HTTPException(404, "Subscription not found")

    allowed = {"status", "amount", "name", "usage_score", "ai_cancel_recommendation"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if not updates:
        raise HTTPException(400, "No valid fields to update")

    await db.subscriptions.update_one({"_id": ObjectId(sub_id)}, {"$set": updates})
    updated = await db.subscriptions.find_one({"_id": ObjectId(sub_id)})
    return {"subscription": _serialize(updated)}


@router.post("/charge-check")
async def charge_check(body: dict):
    """Simulate an incoming subscription charge and run creep detection."""
    virtual_card_id = body.get("virtual_card_id")
    amount = body.get("amount")
    merchant_name = body.get("merchant_name")
    user_id = body.get("user_id")

    if not all([virtual_card_id, amount, merchant_name, user_id]):
        raise HTTPException(400, "virtual_card_id, amount, merchant_name, and user_id are required")

    alert = await check_for_price_creep(
        virtual_card_id=virtual_card_id,
        incoming_amount=amount,
        merchant_name=merchant_name,
        user_id=user_id,
    )

    if alert:
        return {
            "status": "price_creep_detected",
            "alert_id": str(alert["_id"]),
            "delta_pct": alert["delta_pct"],
            "last_known": alert["last_known_amount"],
            "incoming": alert["incoming_amount"],
        }

    return {"status": "ok", "message": "No price change detected"}
