from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException
from database import get_database
from services.stripe_service import stripe_service

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


def serialize(doc):
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)
    return doc


@router.get("/{user_id}")
async def get_alerts(user_id: str):
    db = get_database()
    alerts = await db.anomaly_alerts.find(
        {"user_id": ObjectId(user_id), "status": "pending"}
    ).sort("created_at", -1).to_list(20)
    return {"alerts": [serialize(a) for a in alerts]}


@router.post("/{alert_id}/action")
async def take_action(alert_id: str, body: dict):
    db = get_database()
    action = body.get("action")
    if action not in ("approve_once", "approve_update_limit", "decline_pause"):
        raise HTTPException(400, "action must be approve_once, approve_update_limit, or decline_pause")
    
    alert = await db.anomaly_alerts.find_one({"_id": ObjectId(alert_id)})
    if not alert:
        raise HTTPException(404, "Alert not found")
    
    now = datetime.utcnow()
    
    if action == "approve_once":
        await db.anomaly_alerts.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": {"status": "approved_once", "action_taken": action, "action_taken_at": now}},
        )
        return {"message": f"Approved. {alert['merchant_name']} will be charged ${alert['incoming_amount']:.2f} this time."}
    
    elif action == "approve_update_limit":
        card = await db.virtual_cards.find_one({"_id": alert["virtual_card_id"]})
        if card and card.get("stripe_card_id"):
            await stripe_service.update_limit(card["stripe_card_id"], alert["incoming_amount"])
        
        await db.virtual_cards.update_one(
            {"_id": alert["virtual_card_id"]},
            {"$set": {"spending_limit_monthly": alert["incoming_amount"], "last_known_amount": alert["incoming_amount"]}},
        )
        if alert.get("subscription_id"):
            await db.subscriptions.update_one(
                {"_id": alert["subscription_id"] if isinstance(alert["subscription_id"], ObjectId) else ObjectId(alert["subscription_id"])},
                {"$set": {"last_known_amount": alert["incoming_amount"]}},
            )
        await db.anomaly_alerts.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": {"status": "limit_updated", "action_taken": action, "action_taken_at": now}},
        )
        return {"message": f"Limit updated to ${alert['incoming_amount']:.2f}/month going forward."}
    
    elif action == "decline_pause":
        card = await db.virtual_cards.find_one({"_id": alert["virtual_card_id"]})
        if card and card.get("stripe_card_id"):
            await stripe_service.pause_card(card["stripe_card_id"])
        
        await db.virtual_cards.update_one(
            {"_id": alert["virtual_card_id"]},
            {"$set": {"status": "paused", "paused_at": now}},
        )
        await db.anomaly_alerts.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": {"status": "declined", "action_taken": action, "action_taken_at": now}},
        )
        
        await db.notifications.insert_one({
            "user_id": alert["user_id"],
            "type": "price_creep",
            "title": f"{alert['merchant_name']} charge declined",
            "message": f"{alert['merchant_name']} cannot charge you until you unpause the card.",
            "is_read": False,
            "related_entity_type": "virtual_card",
            "related_entity_id": alert["virtual_card_id"],
            "created_at": now,
        })
        return {"message": f"{alert['merchant_name']} cannot charge you until you unpause the card."}
