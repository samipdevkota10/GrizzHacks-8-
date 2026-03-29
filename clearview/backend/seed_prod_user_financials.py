import asyncio
import random
from calendar import monthrange
from datetime import datetime, timedelta

from bson import ObjectId

from database import get_database

random.seed(42)


def _day_in_month(year: int, month: int, day: int, hour: int = 12) -> datetime:
    _, last = monthrange(year, month)
    d = min(day, last)
    return datetime(year, month, d, hour, 0, 0)


def _build_transactions(user_id: ObjectId, account_id: ObjectId) -> list[dict]:
    now = datetime.utcnow()
    start = now - timedelta(days=90)
    y, m = now.year, now.month

    merchant_domains: dict[str, str | None] = {
        "Spotify": "spotify.com",
        "Chipotle": "chipotle.com",
        "Starbucks": "starbucks.com",
        "Amazon": "amazon.com",
        "Whole Foods": "wholefoodsmarket.com",
        "Trader Joe's": "traderjoes.com",
        "Uber": "uber.com",
        "Lyft": "lyft.com",
        "Employer Payroll": None,
        "Rent Payment": None,
        "DTE Energy": None,
        "Comcast Internet": None,
    }

    txs: list[dict] = []

    def add_tx(
        dt: datetime,
        amount: float,
        merchant: str,
        category: str,
        *,
        is_recurring: bool = False,
        description: str | None = None,
    ) -> None:
        if dt < start or dt > now:
            return
        txs.append(
            {
                "_id": ObjectId(),
                "user_id": user_id,
                "account_id": account_id,
                "virtual_card_id": None,
                "amount": amount,
                "currency": "USD",
                "merchant_name": merchant,
                "merchant_logo_url": merchant_domains.get(merchant),
                "category": category,
                "subcategory": None,
                "description": description,
                "date": dt,
                "is_recurring": is_recurring,
                "anomaly_flag": False,
                "anomaly_alert_id": None,
                "tags": [],
                "ai_summary": None,
                "solana_receipt_tx": None,
                "created_at": dt,
            }
        )

    # Biweekly payroll
    p = start + timedelta(days=2)
    p = p.replace(hour=10, minute=0, second=0, microsecond=0)
    while p <= now:
        add_tx(p, 2400.0, "Employer Payroll", "income", is_recurring=True)
        p += timedelta(days=14)

    # Core recurring bills
    for month_offset in range(-2, 1):
        mm = m + month_offset
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        while mm > 12:
            mm -= 12
            yy += 1
        add_tx(_day_in_month(yy, mm, 1, 9), -1450.0, "Rent Payment", "utilities", is_recurring=True)
        add_tx(_day_in_month(yy, mm, 14, 8), -9.99, "Spotify", "subscription", is_recurring=True)
        add_tx(_day_in_month(yy, mm, 20, 8), -67.0, "DTE Energy", "utilities", is_recurring=True)
        add_tx(_day_in_month(yy, mm, 22, 8), -54.0, "Comcast Internet", "utilities", is_recurring=True)

    # Food + shopping activity
    cy, cm = now.year, now.month
    chipotle_days = [2, 5, 8, 12, 15, 19, 22, 26]
    chipotle_amts = [12.87, 14.20, 13.45, 12.10, 14.95, 13.60, 12.75, 14.30]
    _, last_cm = monthrange(cy, cm)
    for d, a in zip(chipotle_days, chipotle_amts):
        day = min(d, last_cm)
        if day > now.day and (cy, cm) == (y, m):
            continue
        dt = datetime(cy, cm, day, 18, 30, 0)
        if dt <= now:
            add_tx(dt, -a, "Chipotle", "food")

    sb_anchor = max(start, now - timedelta(days=21))
    for w in range(3):
        for dow in (0, 2, 4):
            dt = sb_anchor + timedelta(weeks=w, days=dow)
            if dt <= now:
                add_tx(dt, -round(random.uniform(5.0, 7.15), 2), "Starbucks", "food")

    for wk in (0, 18, 38, 58):
        dt = start + timedelta(days=5 + wk)
        if dt <= now:
            add_tx(dt, -round(random.uniform(15.0, 80.0), 2), "Amazon", "shopping")

    for i in range(4):
        dt = start + timedelta(days=9 + i * 20)
        if dt <= now:
            add_tx(dt, -round(random.uniform(60.0, 120.0), 2), "Whole Foods", "food")
    for i in range(4):
        dt = start + timedelta(days=11 + i * 20)
        if dt <= now:
            add_tx(dt, -round(random.uniform(60.0, 115.0), 2), "Trader Joe's", "food")

    for i, rd in enumerate([7, 23, 38, 55, 71]):
        dt = start + timedelta(days=rd)
        if dt <= now:
            add_tx(dt, -round(random.uniform(15.0, 25.0), 2), "Uber" if i % 2 == 0 else "Lyft", "transport")

    add_tx(start + timedelta(days=40), -189.0, "Amazon", "shopping", description="Electronics purchase")

    txs.sort(key=lambda x: x["date"])
    return txs


async def seed_prod_user() -> None:
    db = get_database()

    candidate_emails = ["alex@verafund.com", "alex@verafunddemo.com"]
    user = await db.users.find_one({"email": {"$in": candidate_emails}})
    if not user:
        user = await db.users.find_one({"email": {"$regex": "^alex@", "$options": "i"}})
    if not user:
        raise RuntimeError("No target user found (expected alex@verafund.com).")

    uid: ObjectId = user["_id"]

    # Resolve profile
    profile = None
    financial_profile_id = user.get("financial_profile_id")
    if financial_profile_id:
        try:
            profile = await db.financial_profiles.find_one({"_id": ObjectId(financial_profile_id)})
        except Exception:
            profile = None
    if not profile:
        profile = await db.financial_profiles.find_one({"user_id": uid})

    if not profile:
        profile_id = ObjectId()
        profile_doc = {
            "_id": profile_id,
            "user_id": uid,
            "monthly_income": 4800.0,
            "monthly_budget": 3500.0,
            "hourly_rate": 30.0,
            "tax_rate": 0.22,
            "category_budgets": {
                "food": 600,
                "transport": 250,
                "entertainment": 240,
                "shopping": 300,
                "health": 200,
                "utilities": 500,
                "subscriptions": 200,
                "other": 100,
            },
            "net_worth": 0.0,
            "total_assets": 0.0,
            "total_liabilities": 0.0,
            "savings_goal_monthly": 500.0,
            "financial_goals": [
                {"name": "Emergency Fund", "target_amount": 15000.0, "current_amount": 8120.0},
                {"name": "Vacation Fund", "target_amount": 3000.0, "current_amount": 1200.0},
            ],
            "last_synced": datetime.utcnow(),
        }
        await db.financial_profiles.insert_one(profile_doc)
        await db.users.update_one({"_id": uid}, {"$set": {"financial_profile_id": str(profile_id)}})
    else:
        await db.financial_profiles.update_one(
            {"_id": profile["_id"]},
            {
                "$set": {
                    "monthly_income": 4800.0,
                    "monthly_budget": 3500.0,
                    "hourly_rate": 30.0,
                    "tax_rate": 0.22,
                    "category_budgets": {
                        "food": 600,
                        "transport": 250,
                        "entertainment": 240,
                        "shopping": 300,
                        "health": 200,
                        "utilities": 500,
                        "subscriptions": 200,
                        "other": 100,
                    },
                    "savings_goal_monthly": 500.0,
                    "financial_goals": [
                        {"name": "Emergency Fund", "target_amount": 15000.0, "current_amount": 8120.0},
                        {"name": "Vacation Fund", "target_amount": 3000.0, "current_amount": 1200.0},
                    ],
                    "last_synced": datetime.utcnow(),
                }
            },
        )

    # Update balances on accounts (create baseline accounts if missing; no card writes)
    accounts = await db.accounts.find({"user_id": uid}).to_list(100)
    balance_targets = {
        "checking": 4247.83,
        "savings": 8120.00,
        "credit": -1340.50,
        "investment": 12372.00,
    }
    if not accounts:
        now = datetime.utcnow()
        await db.accounts.insert_many(
            [
                {
                    "_id": ObjectId(),
                    "user_id": uid,
                    "name": "Chase Checking",
                    "type": "checking",
                    "balance": balance_targets["checking"],
                    "currency": "USD",
                    "institution_name": "Chase",
                    "institution_logo_url": "chase.com",
                    "is_primary_checking": True,
                    "color": "#4F8EF7",
                    "created_at": now,
                    "is_active": True,
                },
                {
                    "_id": ObjectId(),
                    "user_id": uid,
                    "name": "Marcus Savings",
                    "type": "savings",
                    "balance": balance_targets["savings"],
                    "currency": "USD",
                    "institution_name": "Marcus",
                    "institution_logo_url": "marcus.com",
                    "is_primary_checking": False,
                    "color": "#00D26A",
                    "created_at": now,
                    "is_active": True,
                },
                {
                    "_id": ObjectId(),
                    "user_id": uid,
                    "name": "Chase Sapphire Credit",
                    "type": "credit",
                    "balance": balance_targets["credit"],
                    "currency": "USD",
                    "institution_name": "Chase",
                    "institution_logo_url": "chase.com",
                    "is_primary_checking": False,
                    "color": "#FF4757",
                    "created_at": now,
                    "is_active": True,
                },
                {
                    "_id": ObjectId(),
                    "user_id": uid,
                    "name": "Fidelity 401k",
                    "type": "investment",
                    "balance": balance_targets["investment"],
                    "currency": "USD",
                    "institution_name": "Fidelity",
                    "institution_logo_url": "fidelity.com",
                    "is_primary_checking": False,
                    "color": "#FFB836",
                    "created_at": now,
                    "is_active": True,
                },
            ]
        )
        accounts = await db.accounts.find({"user_id": uid}).to_list(100)

    updated_types: set[str] = set()
    checking_account_id: ObjectId | None = None
    for acc in accounts:
        acc_type = acc.get("type")
        if acc_type == "checking" and checking_account_id is None:
            checking_account_id = acc["_id"]
        if acc_type in balance_targets and acc_type not in updated_types:
            await db.accounts.update_one(
                {"_id": acc["_id"]},
                {"$set": {"balance": float(balance_targets[acc_type])}},
            )
            updated_types.add(acc_type)

    if checking_account_id is None and accounts:
        checking_account_id = accounts[0]["_id"]
    if checking_account_id is None:
        raise RuntimeError("User has no accounts; cannot attach seeded transactions safely.")

    # Replace only this user's transactions
    txs = _build_transactions(uid, checking_account_id)
    await db.transactions.delete_many({"user_id": uid})
    if txs:
        await db.transactions.insert_many(txs)

    # Recompute profile totals from accounts after updates
    accounts_after = await db.accounts.find({"user_id": uid}).to_list(100)
    total_assets = round(sum(a.get("balance", 0.0) for a in accounts_after if a.get("balance", 0.0) > 0), 2)
    total_liabilities = round(abs(sum(a.get("balance", 0.0) for a in accounts_after if a.get("balance", 0.0) < 0)), 2)
    net_worth = round(total_assets - total_liabilities, 2)
    await db.financial_profiles.update_one(
        {"user_id": uid},
        {"$set": {"total_assets": total_assets, "total_liabilities": total_liabilities, "net_worth": net_worth}},
    )

    tx_count = await db.transactions.count_documents({"user_id": uid})
    print("Seed complete for user:", str(uid))
    print("Email:", user.get("email"))
    print("Transactions:", tx_count)
    print("Assets:", total_assets, "Liabilities:", total_liabilities, "Net worth:", net_worth)
    print("Cards untouched: virtual_cards/subscriptions not modified.")


if __name__ == "__main__":
    asyncio.run(seed_prod_user())
