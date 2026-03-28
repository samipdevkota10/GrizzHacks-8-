from datetime import datetime, timedelta

from bson import ObjectId

from database import get_database
from objectid_util import parse_user_object_id


async def evaluate_transaction(
    user_id: str,
    amount: float,
    merchant_name: str,
    category: str,
    threshold: float | None = None,
) -> dict | None:
    """Score an incoming transaction for fraud/anomaly signals.

    Returns a dict with ``severity`` and ``reason`` when the transaction
    is suspicious, or ``None`` when it looks normal.
    """
    db = get_database()
    uid = parse_user_object_id(user_id)
    abs_amount = abs(amount)

    user = await db.users.find_one({"_id": uid})
    user_threshold = threshold or (
        user.get("preferences", {}).get("fraud_amount_threshold")
        if user
        else None
    )
    if user_threshold is None:
        from config import settings
        user_threshold = settings.FRAUD_AMOUNT_THRESHOLD

    # --- Rule 1: Large absolute amount ---
    if abs_amount >= user_threshold:
        return {
            "severity": "high",
            "reason": (
                f"Large transaction of ${abs_amount:,.2f} at {merchant_name} "
                f"exceeds your ${user_threshold:,.2f} alert threshold."
            ),
        }

    # --- Rule 2: First-time merchant with amount > $100 ---
    existing = await db.transactions.count_documents(
        {"user_id": uid, "merchant_name": merchant_name}
    )
    if existing == 0 and abs_amount > 100:
        return {
            "severity": "medium",
            "reason": (
                f"First-ever transaction at {merchant_name} for ${abs_amount:,.2f}."
            ),
        }

    # --- Rule 3: Category spend spike (3x monthly average) ---
    now = datetime.utcnow()
    three_months_ago = now - timedelta(days=90)
    pipeline = [
        {"$match": {"user_id": uid, "category": category, "amount": {"$lt": 0},
                     "date": {"$gte": three_months_ago}}},
        {"$group": {"_id": None, "total": {"$sum": {"$abs": "$amount"}}, "count": {"$sum": 1}}},
    ]
    agg = await db.transactions.aggregate(pipeline).to_list(1)
    if agg:
        monthly_avg = agg[0]["total"] / 3
        if abs_amount > monthly_avg * 3 and abs_amount > 50:
            return {
                "severity": "medium",
                "reason": (
                    f"${abs_amount:,.2f} at {merchant_name} is over 3x your "
                    f"monthly average of ${monthly_avg:,.2f} in {category}."
                ),
            }

    return None
