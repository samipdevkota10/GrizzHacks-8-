from datetime import datetime, timedelta

from bson import ObjectId

from database import get_database
from objectid_util import parse_user_object_id


async def build_financial_context(user_id: str) -> dict:
    db = get_database()
    uid = parse_user_object_id(user_id)

    user = await db.users.find_one({"_id": uid})
    profile = await db.financial_profiles.find_one({"user_id": uid})
    accounts = await db.accounts.find({"user_id": uid}).to_list(20)
    subscriptions = await db.subscriptions.find({"user_id": uid, "status": "active"}).to_list(50)
    
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    recent_transactions = await db.transactions.find(
        {"user_id": uid, "date": {"$gte": now - timedelta(days=90)}}
    ).sort("date", -1).to_list(500)
    
    month_txns = [t for t in recent_transactions if t["date"] >= month_start]
    month_spent = sum(abs(t["amount"]) for t in month_txns if t["amount"] < 0)
    month_income = sum(t["amount"] for t in month_txns if t["amount"] > 0)
    
    by_category = {}
    for t in month_txns:
        if t["amount"] < 0:
            cat = t.get("category", "other")
            by_category[cat] = by_category.get(cat, 0) + abs(t["amount"])
    
    top_category = max(by_category.items(), key=lambda x: x[1]) if by_category else ("none", 0)
    
    checking = next((a for a in accounts if a.get("is_primary_checking")), None)
    checking_balance = checking["balance"] if checking else 0
    
    sub_total = sum(s["amount"] for s in subscriptions)
    
    upcoming_bills = []
    bills_total = 0
    for s in subscriptions:
        if s.get("next_billing_date") and s["next_billing_date"] <= now + timedelta(days=30):
            upcoming_bills.append(f"  - {s['name']}: ${s['amount']:.2f} on {s['next_billing_date'].strftime('%b %d')}")
            bills_total += s["amount"]
    
    budget = profile["monthly_budget"] if profile else 3500
    discretionary = budget - month_spent
    
    large_purchases = [t for t in month_txns if t["amount"] < -50]
    large_purchases.sort(key=lambda x: x["amount"])
    large_text = "\n".join(
        f"  - {t['merchant_name']}: ${abs(t['amount']):.2f} on {t['date'].strftime('%b %d')}"
        for t in large_purchases[:5]
    )
    
    net_worth = profile["net_worth"] if profile else 0
    
    context_text = f"""FINANCIAL SNAPSHOT (as of right now):
- Net Worth: ${net_worth:,.2f}
- Checking Balance: ${checking_balance:,.2f}
- This Month: Spent ${month_spent:,.2f} of ${budget:,.2f} budget
- Discretionary Left: ${discretionary:,.2f}
- Top Spending Category: {top_category[0]} (${top_category[1]:,.2f} this month)
- Active Subscriptions: {len(subscriptions)} services = ${sub_total:,.2f}/month
- Bills Due Next 30 Days: ${bills_total:,.2f}

UPCOMING BILLS:
{chr(10).join(upcoming_bills) if upcoming_bills else "  None in next 30 days"}

RECENT LARGE PURCHASES:
{large_text if large_text else "  None over $50 this month"}"""

    return {
        "context_text": context_text,
        "net_worth": net_worth,
        "checking_balance": checking_balance,
        "month_spent": month_spent,
        "monthly_budget": budget,
        "discretionary_remaining": discretionary,
        "subscription_count": len(subscriptions),
        "subscription_total_monthly": sub_total,
        "upcoming_bills_30d": bills_total,
        "top_category": top_category[0],
        "top_category_amount": top_category[1],
        "user_name": user.get("name", "there") if user else "there",
    }
