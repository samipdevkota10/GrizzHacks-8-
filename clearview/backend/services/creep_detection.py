from datetime import datetime
from bson import ObjectId
from database import get_database


async def check_for_price_creep(
    virtual_card_id: str,
    incoming_amount: float,
    merchant_name: str,
    user_id: str,
    threshold_pct: float = 5.0,
) -> dict | None:
    db = get_database()
    card = await db.virtual_cards.find_one({"_id": ObjectId(virtual_card_id)})
    if not card or card.get("last_known_amount") is None:
        await db.virtual_cards.update_one(
            {"_id": ObjectId(virtual_card_id)},
            {"$set": {"last_known_amount": incoming_amount}},
        )
        return None

    last_amount = card["last_known_amount"]
    if last_amount == 0:
        return None
    delta = incoming_amount - last_amount
    delta_pct = (delta / last_amount) * 100

    if delta_pct > threshold_pct:
        alert = {
            "user_id": ObjectId(user_id),
            "virtual_card_id": ObjectId(virtual_card_id),
            "merchant_name": merchant_name,
            "last_known_amount": last_amount,
            "incoming_amount": incoming_amount,
            "delta_pct": round(delta_pct, 1),
            "threshold_pct": threshold_pct,
            "status": "pending",
            "action_taken": None,
            "action_taken_at": None,
            "created_at": datetime.utcnow(),
            "is_read": False,
        }
        result = await db.anomaly_alerts.insert_one(alert)
        alert["_id"] = result.inserted_id

        await db.notifications.insert_one({
            "user_id": ObjectId(user_id),
            "type": "price_creep",
            "title": f"{merchant_name} raised their price",
            "message": f"{merchant_name} tried to charge ${incoming_amount:.2f} — up {delta_pct:.1f}% from ${last_amount:.2f}",
            "is_read": False,
            "related_entity_type": "virtual_card",
            "related_entity_id": ObjectId(virtual_card_id),
            "created_at": datetime.utcnow(),
        })
        return alert

    await db.virtual_cards.update_one(
        {"_id": ObjectId(virtual_card_id)},
        {"$set": {"last_known_amount": incoming_amount}},
    )
    return None
