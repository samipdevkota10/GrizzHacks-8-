import asyncio
import random
from calendar import monthrange
from datetime import datetime, timedelta

from bson import ObjectId

from database import get_database

random.seed(42)


def _month_start(d: datetime) -> datetime:
    return d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _day_in_month(year: int, month: int, day: int, hour: int = 12) -> datetime:
    _, last = monthrange(year, month)
    d = min(day, last)
    return datetime(year, month, d, hour, 0, 0)


async def seed() -> None:
    db = get_database()
    for name in await db.list_collection_names():
        if not name.startswith("system."):
            await db.drop_collection(name)

    now = datetime.utcnow()
    start = now - timedelta(days=90)
    user_id = ObjectId()
    profile_id = ObjectId()

    checking_id = ObjectId()
    savings_id = ObjectId()
    credit_id = ObjectId()
    investment_id = ObjectId()

    await db.users.insert_one(
        {
            "_id": user_id,
            "email": "alex@clearviewdemo.com",
            "name": "Alex Chen",
            "avatar_url": None,
            "created_at": now,
            "updated_at": None,
            "vera_character_id": None,
            "vera_name": "Vera",
            "vera_voice_id": None,
            "vera_personality": "professional",
            "financial_profile_id": str(profile_id),
            "preferences": {
                "currency": "USD",
                "theme": "dark",
                "creep_detection_threshold": 5.0,
                "notification_budget_threshold": 0.8,
            },
            "onboarding_complete": True,
            "solana_wallet_pubkey": None,
        }
    )

    await db.financial_profiles.insert_one(
        {
            "_id": profile_id,
            "user_id": user_id,
            "monthly_income": 4800.0,
            "monthly_budget": 3500.0,
            "category_budgets": {
                "food": 600,
                "transport": 250,
                "entertainment": 200,
                "shopping": 300,
                "health": 150,
                "utilities": 200,
                "subscriptions": 200,
                "other": 100,
            },
            "net_worth": 23399.33,
            "total_assets": 24739.83,
            "total_liabilities": 1340.50,
            "savings_goal_monthly": 500.0,
            "financial_goals": [],
            "last_synced": None,
        }
    )

    uid = user_id
    accounts = [
        {
            "_id": checking_id,
            "user_id": uid,
            "name": "Chase Checking",
            "type": "checking",
            "balance": 4247.83,
            "currency": "USD",
            "institution_name": "Chase",
            "institution_logo_url": None,
            "is_primary_checking": True,
            "color": "#4F8EF7",
            "created_at": now,
            "is_active": True,
        },
        {
            "_id": savings_id,
            "user_id": uid,
            "name": "Marcus Savings",
            "type": "savings",
            "balance": 8120.00,
            "currency": "USD",
            "institution_name": "Marcus",
            "institution_logo_url": None,
            "is_primary_checking": False,
            "color": "#00D26A",
            "created_at": now,
            "is_active": True,
        },
        {
            "_id": credit_id,
            "user_id": uid,
            "name": "Chase Sapphire Credit",
            "type": "credit",
            "balance": -1340.50,
            "currency": "USD",
            "institution_name": "Chase",
            "institution_logo_url": None,
            "is_primary_checking": False,
            "color": "#FF4757",
            "created_at": now,
            "is_active": True,
        },
        {
            "_id": investment_id,
            "user_id": uid,
            "name": "Fidelity 401k",
            "type": "investment",
            "balance": 12372.00,
            "currency": "USD",
            "institution_name": "Fidelity",
            "institution_logo_url": None,
            "is_primary_checking": False,
            "color": "#FFB836",
            "created_at": now,
            "is_active": True,
        },
    ]
    await db.accounts.insert_many(accounts)

    checking_str = str(checking_id)
    card_specs = [
        ("Netflix", "4829", 25.00, 15.99, "red"),
        ("Spotify", "7712", 15.00, 9.99, "green"),
        ("Planet Fitness", "3351", 50.00, 24.99, "blue"),
        ("Adobe Creative Cloud", "6644", 60.00, 54.99, "purple"),
        ("iCloud", "1198", 5.00, 2.99, "blue"),
        ("New York Times", "5523", 20.00, 17.00, "blue"),
        ("Amazon Prime", "8837", 20.00, 14.99, "blue"),
        ("Hulu", "2290", 25.00, 17.99, "green"),
    ]
    card_docs = []
    card_ids_by_merchant: dict[str, ObjectId] = {}
    for nick, last4, limit_m, last_amt, scheme in card_specs:
        cid = ObjectId()
        card_ids_by_merchant[nick] = cid
        card_docs.append(
            {
                "_id": cid,
                "user_id": uid,
                "stripe_card_id": "",
                "nickname": nick,
                "merchant_name": nick,
                "merchant_logo_url": None,
                "merchant_category": "subscription",
                "last4": last4,
                "exp_month": 12,
                "exp_year": 2028,
                "status": "active",
                "spending_limit_monthly": limit_m,
                "spent_this_month": 0.0,
                "last_known_amount": last_amt,
                "funding_account_id": checking_str,
                "color_scheme": scheme,
                "created_at": now,
                "paused_at": None,
                "destroyed_at": None,
                "total_charged_lifetime": 0.0,
                "charge_count": 0,
                "solana_wallet": None,
            }
        )
    await db.virtual_cards.insert_many(card_docs)

    sub_rows = [
        ("Netflix", 17.99, "streaming", 72, False, 15.99),
        ("Spotify", 9.99, "streaming", 95, False, 9.99),
        ("Planet Fitness", 24.99, "fitness", 15, True, 24.99),
        ("Adobe Creative Cloud", 54.99, "software", 80, False, 54.99),
        ("iCloud 200GB", 2.99, "cloud", 90, False, 2.99),
        ("New York Times", 17.00, "news", 40, True, 17.00),
        ("Amazon Prime", 14.99, "shopping", 85, False, 14.99),
        ("Hulu", 17.99, "streaming", 55, False, 17.99),
    ]
    merchant_to_card = {
        "Netflix": "Netflix",
        "Spotify": "Spotify",
        "Planet Fitness": "Planet Fitness",
        "Adobe Creative Cloud": "Adobe Creative Cloud",
        "iCloud 200GB": "iCloud",
        "New York Times": "New York Times",
        "Amazon Prime": "Amazon Prime",
        "Hulu": "Hulu",
    }
    sub_docs = []
    sub_ids_by_name: dict[str, ObjectId] = {}
    for i, (name, amount, cat, usage, cancel, last_known) in enumerate(sub_rows):
        sid = ObjectId()
        sub_ids_by_name[name] = sid
        m = merchant_to_card[name]
        next_d = now + timedelta(days=3 + i * 4)
        sub_docs.append(
            {
                "_id": sid,
                "user_id": uid,
                "virtual_card_id": str(card_ids_by_merchant[m]),
                "name": name,
                "logo_url": None,
                "amount": amount,
                "billing_cycle": "monthly",
                "next_billing_date": next_d,
                "category": cat,
                "status": "active",
                "usage_score": usage,
                "ai_cancel_recommendation": cancel,
                "last_known_amount": last_known,
                "price_history": [],
                "created_at": now,
            }
        )
    await db.subscriptions.insert_many(sub_docs)

    netflix_card_id = card_ids_by_merchant["Netflix"]
    netflix_sub_id = sub_ids_by_name["Netflix"]
    alert_id = ObjectId()
    await db.anomaly_alerts.insert_one(
        {
            "_id": alert_id,
            "user_id": uid,
            "subscription_id": str(netflix_sub_id),
            "virtual_card_id": str(netflix_card_id),
            "merchant_name": "Netflix",
            "last_known_amount": 15.99,
            "incoming_amount": 17.99,
            "delta_pct": 12.5,
            "threshold_pct": 5.0,
            "status": "pending",
            "action_taken": None,
            "action_taken_at": None,
            "created_at": now,
            "is_read": False,
        }
    )

    await db.notifications.insert_one(
        {
            "_id": ObjectId(),
            "user_id": uid,
            "type": "price_creep",
            "title": "Netflix raised their price",
            "message": "Netflix tried to charge $17.99 — up 12.5% from $15.99",
            "is_read": False,
            "action_url": None,
            "related_entity_type": "subscription",
            "related_entity_id": str(netflix_sub_id),
            "created_at": now,
        }
    )

    transactions: list[dict] = []
    y, m = now.year, now.month

    def add_tx(
        dt: datetime,
        amount: float,
        merchant: str,
        category: str,
        *,
        is_recurring: bool = False,
        anomaly_flag: bool = False,
        anomaly_alert_id: str | None = None,
        virtual_card_id: str | None = None,
        description: str | None = None,
    ) -> None:
        if dt < start or dt > now:
            return
        transactions.append(
            {
                "_id": ObjectId(),
                "user_id": uid,
                "account_id": checking_str,
                "virtual_card_id": virtual_card_id,
                "amount": amount,
                "currency": "USD",
                "merchant_name": merchant,
                "merchant_logo_url": None,
                "category": category,
                "subcategory": None,
                "description": description,
                "date": dt,
                "is_recurring": is_recurring,
                "anomaly_flag": anomaly_flag,
                "anomaly_alert_id": anomaly_alert_id,
                "tags": [],
                "ai_summary": None,
                "solana_receipt_tx": None,
                "created_at": dt,
            }
        )

    p = start + timedelta(days=2)
    p = p.replace(hour=10, minute=0, second=0, microsecond=0)
    while p <= now:
        add_tx(p, 2400.0, "Employer Payroll", "income", is_recurring=True)
        p += timedelta(days=14)

    for month_offset in range(-2, 1):
        mm = m + month_offset
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        while mm > 12:
            mm -= 12
            yy += 1
        r = _day_in_month(yy, mm, 1, 9)
        add_tx(r, -1450.0, "Rent Payment", "utilities", is_recurring=True)

    for month_offset in range(-2, 1):
        mm = m + month_offset
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        while mm > 12:
            mm -= 12
            yy += 1
        add_tx(_day_in_month(yy, mm, 5, 10), -24.99, "Planet Fitness", "subscription", is_recurring=True, virtual_card_id=str(card_ids_by_merchant["Planet Fitness"]))

    netflix_anomaly_date = _day_in_month(y, m, min(18, now.day), 11)
    if netflix_anomaly_date > now:
        netflix_anomaly_date = now - timedelta(days=1)
    for month_offset in range(-3, 0):
        mm = m + month_offset
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        while mm > 12:
            mm -= 12
            yy += 1
        add_tx(
            _day_in_month(yy, mm, 12, 11),
            -15.99,
            "Netflix",
            "subscription",
            is_recurring=True,
            virtual_card_id=str(netflix_card_id),
        )
    add_tx(
        netflix_anomaly_date,
        -17.99,
        "Netflix",
        "subscription",
        is_recurring=True,
        anomaly_flag=True,
        anomaly_alert_id=str(alert_id),
        virtual_card_id=str(netflix_card_id),
    )

    sub_charge_day = {"Spotify": 14, "Adobe Creative Cloud": 16, "iCloud 200GB": 17, "New York Times": 19, "Amazon Prime": 21, "Hulu": 22}
    sub_amounts = {
        "Spotify": 9.99,
        "Adobe Creative Cloud": 54.99,
        "iCloud 200GB": 2.99,
        "New York Times": 17.00,
        "Amazon Prime": 14.99,
        "Hulu": 17.99,
    }
    sub_card_key = {
        "Spotify": "Spotify",
        "Adobe Creative Cloud": "Adobe Creative Cloud",
        "iCloud 200GB": "iCloud",
        "New York Times": "New York Times",
        "Amazon Prime": "Amazon Prime",
        "Hulu": "Hulu",
    }
    for name, amt in sub_amounts.items():
        ck = sub_card_key[name]
        for month_offset in range(-2, 1):
            mm = m + month_offset
            yy = y
            while mm <= 0:
                mm += 12
                yy -= 1
            while mm > 12:
                mm -= 12
                yy += 1
            add_tx(
                _day_in_month(yy, mm, sub_charge_day[name], 8),
                -amt,
                name,
                "subscription",
                is_recurring=True,
                virtual_card_id=str(card_ids_by_merchant[ck]),
            )

    for month_offset in range(-2, 1):
        mm = m + month_offset
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        while mm > 12:
            mm -= 12
            yy += 1
        add_tx(_day_in_month(yy, mm, 20, 8), -67.0, "DTE Energy", "utilities", is_recurring=True)
        add_tx(_day_in_month(yy, mm, 22, 8), -54.0, "Comcast Internet", "utilities", is_recurring=True)

    cy, cm = now.year, now.month
    chipotle_march_days = [2, 5, 8, 12, 15, 19, 22, 26]
    chipotle_march_amts = [12.87, 14.20, 13.45, 12.10, 14.95, 13.60, 12.75, 14.30]
    _, last_cm = monthrange(cy, cm)
    for d, a in zip(chipotle_march_days, chipotle_march_amts):
        day = min(d, last_cm)
        if day > now.day and (cy, cm) == (y, m):
            continue
        dt = datetime(cy, cm, day, 18, 30, 0)
        if (cy, cm) == (y, m) and dt > now:
            continue
        add_tx(dt, -a, "Chipotle", "food")

    target_chipotle = 340.0
    march_sum = sum(chipotle_march_amts)
    remaining = max(0.0, target_chipotle - march_sum)
    n_extra = 14
    avg = remaining / n_extra if n_extra else 0.0
    t = start + timedelta(days=4)
    step = 5
    chipotle_extra = 0.0
    for i in range(n_extra):
        lo = max(11.5, avg * 0.9)
        hi = min(16.2, avg * 1.1)
        amt = round(random.uniform(lo, hi), 2)
        chipotle_extra += amt
        add_tx(t + timedelta(days=i * step), -amt, "Chipotle", "food")
        if chipotle_extra >= remaining - 5.0:
            break

    sb_anchor = max(start, now - timedelta(days=21))
    for w in range(3):
        for dow in (0, 2, 4):
            dt = sb_anchor + timedelta(weeks=w, days=dow)
            if dt > now:
                continue
            add_tx(dt, -round(random.uniform(5.0, 7.15), 2), "Starbucks", "food")

    for wk in (0, 18, 38, 58):
        dt = start + timedelta(days=5 + wk)
        if dt > now:
            break
        add_tx(dt, -round(random.uniform(15.0, 80.0), 2), "Amazon", "shopping")

    for i in range(4):
        dt = start + timedelta(days=9 + i * 20)
        if dt > now:
            break
        add_tx(dt, -round(random.uniform(60.0, 120.0), 2), "Whole Foods", "food")
    for i in range(4):
        dt = start + timedelta(days=11 + i * 20)
        if dt > now:
            break
        add_tx(dt, -round(random.uniform(60.0, 115.0), 2), "Trader Joe's", "food")

    ride_days = [7, 23, 38, 55, 71]
    for i, rd in enumerate(ride_days):
        dt = start + timedelta(days=rd)
        if dt > now:
            break
        svc = "Uber" if i % 2 == 0 else "Lyft"
        add_tx(dt, -round(random.uniform(15.0, 25.0), 2), svc, "transport")

    add_tx(start + timedelta(days=40), -189.0, "Best Buy", "shopping", description="Electronics purchase")

    transactions = [tx for tx in transactions if start <= tx["date"] <= now]
    transactions.sort(key=lambda x: x["date"])
    if transactions:
        await db.transactions.insert_many(transactions)

    user_count = await db.users.count_documents({})
    account_count = await db.accounts.count_documents({})
    card_count = await db.virtual_cards.count_documents({})
    sub_count = await db.subscriptions.count_documents({})
    txn_count = await db.transactions.count_documents({})
    alert_count = await db.anomaly_alerts.count_documents({})

    print()
    print("=" * 60)
    print("CLEARVIEW DATABASE SEEDED SUCCESSFULLY")
    print("=" * 60)
    print(f"  Users:         {user_count}")
    print(f"  Accounts:      {account_count}")
    print(f"  Virtual Cards: {card_count}")
    print(f"  Subscriptions: {sub_count}")
    print(f"  Transactions:  {txn_count}")
    print(f"  Alerts:        {alert_count}")
    print()
    print(f"  USER ID: {user_id}")
    print()
    print("  Copy the USER ID above and set it in your browser:")
    print(f'  localStorage.setItem("clearview_user_id", "{user_id}");')
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed())
