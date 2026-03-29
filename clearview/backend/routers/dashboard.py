from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import get_database
from objectid_util import parse_user_object_id
from services.action_center import (
    build_action_center,
    build_budget_pulse,
    build_bill_risk,
    build_daily_snapshot,
)

router = APIRouter(prefix="/api", tags=["dashboard"])


class DashboardEventPayload(BaseModel):
    user_id: str
    event_name: str
    event_payload: dict = {}


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
    uid = parse_user_object_id(user_id)

    user = await db.users.find_one({"_id": uid})
    if not user:
        raise HTTPException(404, "User not found")

    profile = await db.financial_profiles.find_one({"user_id": uid})
    accounts = await db.accounts.find({"user_id": uid}).to_list(20)
    subscriptions = await db.subscriptions.find({"user_id": uid}).to_list(50)
    recent_transactions = await db.transactions.find({"user_id": uid}).sort(
        "date", -1
    ).to_list(50)
    virtual_cards = await db.virtual_cards.find({"user_id": uid}).to_list(20)
    pending_alerts = await db.anomaly_alerts.find(
        {"user_id": uid, "status": "pending"}
    ).sort("created_at", -1).to_list(20)
    notifications = await db.notifications.find(
        {"user_id": uid, "is_read": False}
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
    monthly_income = profile.get("monthly_income", 4800) if profile else 4800
    savings_goal = profile.get("savings_goal_monthly", 0) if profile else 0
    net_worth = profile["net_worth"] if profile else 0

    days_in_month = (
        (now.replace(month=now.month % 12 + 1, day=1) - timedelta(days=1)).day
        if now.month < 12
        else 31
    )
    days_passed = now.day
    avg_daily = month_spent / max(days_passed, 1)
    top_category = max(by_category.items(), key=lambda x: x[1]) if by_category else ("none", 0)

    checking = next(
        (a for a in accounts if a.get("is_primary_checking")), None
    )
    checking_balance = checking["balance"] if checking else 0

    bill_risk = build_bill_risk(subscriptions, checking_balance, now)
    user_name = user.get("name", "User")

    daily_snapshot = build_daily_snapshot(
        net_worth=net_worth,
        net_worth_30d_ago=net_worth,
        month_spent=month_spent,
        monthly_budget=budget,
        month_income=month_income,
        month_income_30d_ago=0,
        user_name=user_name,
    )

    action_center = build_action_center(
        month_spent=month_spent,
        monthly_budget=budget,
        checking_balance=checking_balance,
        due_30d=bill_risk["due_30d_total"],
        at_risk_bills=bill_risk["at_risk_bills"],
        subscriptions=subscriptions,
        monthly_income=monthly_income,
        savings_goal_monthly=savings_goal,
        pending_alerts=pending_alerts,
    )

    budget_pulse = build_budget_pulse(month_spent, budget, now)

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
        "net_worth": net_worth,
        "daily_snapshot": daily_snapshot,
        "action_center": action_center,
        "budget_pulse": budget_pulse,
        "bill_risk": bill_risk,
    }


@router.post("/dashboard/events")
async def post_dashboard_event(body: DashboardEventPayload):
    db = get_database()
    uid = parse_user_object_id(body.user_id)
    doc = {
        "user_id": uid,
        "event_name": body.event_name,
        "event_payload": body.event_payload,
        "created_at": datetime.utcnow(),
    }
    await db.dashboard_events.insert_one(doc)
    return {"status": "ok"}
