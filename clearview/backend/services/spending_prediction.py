"""Spending prediction engine — forecasts next month and daily cash flow."""

from datetime import datetime, timedelta

from bson import ObjectId

from database import get_database


async def predict_next_month(user_id: ObjectId) -> dict:
    """Predict next month's spending by category using weighted moving average."""
    db = get_database()
    now = datetime.utcnow()

    profile = await db.financial_profiles.find_one({"user_id": user_id})
    budgets = profile.get("category_budgets", {}) if profile else {}
    monthly_budget = profile.get("monthly_budget", 2000) if profile else 2000

    # Get last 3 months of transactions
    three_months_ago = now - timedelta(days=90)
    txns = await db.transactions.find({
        "user_id": user_id,
        "date": {"$gte": three_months_ago},
        "amount": {"$lt": 0},
    }).to_list(1000)

    # Group by month and category
    monthly_cats: dict[int, dict[str, float]] = {}  # month_offset -> {cat: total}
    for tx in txns:
        dt = tx["date"]
        month_diff = (now.year - dt.year) * 12 + (now.month - dt.month)
        if month_diff > 3 or month_diff < 0:
            continue
        cat = tx.get("category", "other")
        if cat == "income":
            continue
        monthly_cats.setdefault(month_diff, {})
        monthly_cats[month_diff][cat] = monthly_cats[month_diff].get(cat, 0) + abs(tx["amount"])

    all_cats = set()
    for mc in monthly_cats.values():
        all_cats.update(mc.keys())

    predictions = []
    total_predicted = 0.0

    weights = [0.5, 0.3, 0.2]  # most recent month gets highest weight

    for cat in sorted(all_cats):
        if cat == "income":
            continue
        values = []
        for offset in range(3):
            values.append(monthly_cats.get(offset, {}).get(cat, 0))
        # values[0] = current month, values[1] = last month, values[2] = 2 months ago
        # For prediction, weight last complete months more
        if len(values) >= 3 and values[1] > 0:
            predicted = values[1] * weights[0] + values[2] * weights[1] + values[0] * weights[2]
        elif len(values) >= 2 and values[1] > 0:
            predicted = values[1] * 0.6 + values[0] * 0.4
        else:
            predicted = values[0]

        predicted = round(predicted, 2)
        budgeted = budgets.get(cat, 0)
        total_predicted += predicted
        predictions.append({
            "category": cat,
            "predicted": predicted,
            "budgeted": budgeted,
            "over_budget": predicted > budgeted > 0,
        })

    predictions.sort(key=lambda p: p["predicted"], reverse=True)

    return {
        "predictions": predictions,
        "total_predicted": round(total_predicted, 2),
        "total_budget": monthly_budget,
    }


async def cash_flow_forecast(user_id: ObjectId) -> dict:
    """Project checking balance day-by-day for the next 30 days."""
    db = get_database()
    now = datetime.utcnow()

    profile = await db.financial_profiles.find_one({"user_id": user_id})
    checking = await db.accounts.find_one({"user_id": user_id, "is_primary_checking": True})
    current_balance = checking["balance"] if checking else 0

    pay_frequency = profile.get("pay_frequency", "biweekly") if profile else "biweekly"
    last_pay = profile.get("last_pay_date", now) if profile else now
    pay_amount = 1200.0  # net bi-weekly paycheck

    # Get upcoming subscriptions/bills
    subs = await db.subscriptions.find({
        "user_id": user_id,
        "status": "active",
    }).to_list(50)

    # Estimate daily spending from recent history
    week_ago = now - timedelta(days=14)
    recent_txns = await db.transactions.find({
        "user_id": user_id,
        "date": {"$gte": week_ago},
        "amount": {"$lt": 0},
    }).to_list(200)

    daily_non_recurring = 0.0
    for tx in recent_txns:
        if not tx.get("is_recurring"):
            daily_non_recurring += abs(tx["amount"])
    daily_non_recurring = daily_non_recurring / 14 if recent_txns else 50.0

    # Build daily forecast
    balance = current_balance
    forecast = []
    danger_threshold = 300.0

    for day_offset in range(31):
        day = now + timedelta(days=day_offset)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        event = None

        # Check for paycheck
        if pay_frequency == "biweekly":
            check = last_pay
            while check < day_start:
                check += timedelta(days=14)
            if check.date() == day_start.date():
                balance += pay_amount
                event = f"Paycheck +${pay_amount:,.0f}"
        elif pay_frequency == "weekly":
            check = last_pay
            while check < day_start:
                check += timedelta(days=7)
            if check.date() == day_start.date():
                balance += pay_amount / 2
                event = f"Paycheck +${pay_amount / 2:,.0f}"

        # Check for bills/subs due
        for sub in subs:
            nbd = sub.get("next_billing_date")
            if not nbd:
                continue
            if isinstance(nbd, str):
                try:
                    nbd = datetime.fromisoformat(nbd)
                except (ValueError, TypeError):
                    continue
            if nbd.date() == day_start.date():
                balance -= sub.get("amount", 0)
                event = event or f"{sub.get('name', 'Bill')} -${sub.get('amount', 0):.2f}"

        # Check for rent on the 1st
        if day_start.day == 1 and day_offset > 0:
            balance -= 875.0
            event = event or "Rent -$875"

        # Subtract estimated daily spend (weekdays cost more)
        if day_start.weekday() < 5:
            balance -= daily_non_recurring * 1.1
        else:
            balance -= daily_non_recurring * 0.8

        forecast.append({
            "date": day_start.isoformat(),
            "balance": round(balance, 2),
            "event": event,
        })

    return {
        "forecast": forecast,
        "danger_zone_threshold": danger_threshold,
    }
