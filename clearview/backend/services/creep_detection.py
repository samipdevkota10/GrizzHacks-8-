"""Subscription price-creep detection.

Detects when a recurring merchant starts charging more than their
historical average — a sign of quiet price increases on subscriptions.
"""

import logging
from datetime import datetime, timedelta

from bson import ObjectId

from database import get_database

logger = logging.getLogger(__name__)

_CREEP_THRESHOLD_PCT = 0.10  # flag if new charge is >10% above rolling avg


async def check_for_price_creep(
    virtual_card_id: str,
    incoming_amount: float,
    merchant_name: str,
    user_id: str,
) -> dict | None:
    """Return a creep-alert document if this charge is significantly higher
    than the recent average for this merchant on this virtual card.

    Returns the inserted alert doc or None if no creep detected.
    """
    db = get_database()

    try:
        card_oid = ObjectId(virtual_card_id)
    except Exception:
        return None

    # Look at the last 90 days of charges from this merchant on this card
    cutoff = datetime.utcnow() - timedelta(days=90)
    past_txns = await db.transactions.find(
        {
            "virtual_card_id": virtual_card_id,
            "merchant_name": merchant_name,
            "amount": {"$lt": 0},  # charges are negative
            "date": {"$gte": cutoff},
        }
    ).sort("date", -1).to_list(20)

    if len(past_txns) < 2:
        # Not enough history to establish a baseline
        return None

    amounts = [abs(t["amount"]) for t in past_txns]
    avg = sum(amounts) / len(amounts)

    if avg == 0:
        return None

    increase_pct = (incoming_amount - avg) / avg

    if increase_pct <= _CREEP_THRESHOLD_PCT:
        return None

    # Price creep detected — log a creep alert
    logger.info(
        "Price creep detected: %s on card %s — %.0f%% above avg $%.2f",
        merchant_name, virtual_card_id, increase_pct * 100, avg,
    )

    now = datetime.utcnow()
    from objectid_util import parse_user_object_id
    uid = parse_user_object_id(user_id)

    alert_doc = {
        "_id": ObjectId(),
        "user_id": uid,
        "virtual_card_id": card_oid,
        "merchant_name": merchant_name,
        "type": "price_creep",
        "average_amount": round(avg, 2),
        "new_amount": round(incoming_amount, 2),
        "increase_pct": round(increase_pct * 100, 1),
        "status": "open",
        "created_at": now,
    }
    await db.creep_alerts.insert_one(alert_doc)

    # Also push a notification
    await db.notifications.insert_one({
        "_id": ObjectId(),
        "user_id": uid,
        "type": "price_creep",
        "title": f"Price increase detected: {merchant_name}",
        "message": (
            f"{merchant_name} charged ${incoming_amount:.2f} — "
            f"{increase_pct * 100:.0f}% more than your usual ${avg:.2f}."
        ),
        "is_read": False,
        "related_entity_type": "creep_alert",
        "related_entity_id": str(alert_doc["_id"]),
        "created_at": now,
    })

    return alert_doc
