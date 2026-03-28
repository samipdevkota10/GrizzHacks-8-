from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from database import get_database

router = APIRouter(prefix="/api", tags=["dashboard"])


def serialize_doc(doc):
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
    return doc


def serialize_list(docs):
    return [serialize_doc(doc) for doc in docs]


@router.get("/dashboard/{user_id}")
async def get_dashboard(user_id: str):
    db = get_database()

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")

    profile = await db.financial_profiles.find_one({"user_id": ObjectId(user_id)})
    accounts = await db.accounts.find({"user_id": ObjectId(user_id)}).to_list(20)
    subscriptions = await db.subscriptions.find({"user_id": ObjectId(user_id)}).to_list(50)
    recent_transactions = await db.transactions.find({"user_id": ObjectId(user_id)}).sort(
        "date", -1
    ).to_list(50)
    virtual_cards = await db.virtual_cards.find({"user_id": ObjectId(user_id)}).to_list(20)
    pending_alerts = await db.anomaly_alerts.find(
        {"user_id": ObjectId(user_id), "status": "pending"}
    ).sort("created_at", -1).to_list(20)
    notifications = await db.notifications.find(
        {"user_id": ObjectId(user_id), "is_read": False}
    ).sort("created_at", -1).to_list(20)

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    month_transactions = [t for t in recent_transactions if t["date"] >= month_start]
    month_spent = sum(abs(t["amount"]) for t in month_transactions if t["amount"] < 0)
    month_income = sum(t["amount"] for t in month_transactions if t["amount"] > 0)

    by_category = {}
    for t in month_transactions:
        if t["amount"] < 0:
            cat = t.get("category", "other")
            by_category[cat] = by_category.get(cat, 0) + abs(t["amount"])

    upcoming_bills = []
    for sub in subscriptions:
        if sub.get("status") == "active" and sub.get("next_billing_date"):
            if sub["next_billing_date"] <= now + timedelta(days=30):
                upcoming_bills.append(
                    {
                        "name": sub["name"],
                        "amount": sub["amount"],
                        "date": sub["next_billing_date"].isoformat(),
                        "logo_url": sub.get("logo_url"),
                    }
                )

    budget = profile["monthly_budget"] if profile else 3500

    days_in_month = (
        (now.replace(month=now.month % 12 + 1, day=1) - timedelta(days=1)).day
        if now.month < 12
        else 31
    )
    days_passed = now.day
    avg_daily = month_spent / max(days_passed, 1)
    top_category = max(by_category.items(), key=lambda x: x[1]) if by_category else ("none", 0)

    return {
        "user": serialize_doc(user),
        "financial_profile": serialize_doc(profile),
        "accounts": serialize_list(accounts),
        "subscriptions": serialize_list(subscriptions),
        "recent_transactions": serialize_list(recent_transactions),
        "virtual_cards": serialize_list(virtual_cards),
        "pending_alerts": serialize_list(pending_alerts),
        "notifications": serialize_list(notifications),
        "monthly_summary": {
            "spent": round(month_spent, 2),
            "income": round(month_income, 2),
            "budget": budget,
            "remaining": round(budget - month_spent, 2),
            "by_category": {k: round(v, 2) for k, v in by_category.items()},
        },
        "upcoming_bills": upcoming_bills,
        "quick_stats": {
            "avg_daily_spend": round(avg_daily, 2),
            "top_category": top_category[0],
            "top_category_amount": round(top_category[1], 2),
            "days_until_paycheck": max(0, 15 - (now.day % 15)),
        },
        "net_worth": profile["net_worth"] if profile else 0,
    }
