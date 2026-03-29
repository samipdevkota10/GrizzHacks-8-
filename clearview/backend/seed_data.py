import asyncio
import random
from calendar import monthrange
from datetime import datetime, timedelta

from bson import ObjectId

from database import get_database
from services.auth_service import create_access_token, hash_password

random.seed(42)


def _month_start(d: datetime) -> datetime:
    return d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _day_in_month(year: int, month: int, day: int, hour: int = 12) -> datetime:
    _, last = monthrange(year, month)
    d = min(day, last)
    return datetime(year, month, d, hour, 0, 0)


def _next_biweekly_pay(anchor: datetime, ref: datetime) -> datetime:
    """Return the next bi-weekly Friday pay date on or after `ref`."""
    d = anchor
    while d < ref:
        d += timedelta(days=14)
    return d


async def seed() -> None:
    db = get_database()
    for name in await db.list_collection_names():
        if not name.startswith("system."):
            await db.drop_collection(name)

    now = datetime.utcnow()
    start = now - timedelta(days=90)
    # Fixed IDs so the user survives reseeds (matches .env.local / production)
    user_id = ObjectId("69c8872cbab93b1d2a3387c0")
    profile_id = ObjectId("69c8872cbab93b1d2a3387c1")

    checking_id = ObjectId()
    savings_id = ObjectId()
    credit_id = ObjectId()

    # ── User ──────────────────────────────────────────────────
    await db.users.insert_one(
        {
            "_id": user_id,
            "email": "alex@verafunddemo.com",
            "name": "Alex Chen",
            "password_hash": hash_password("demo123"),
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
            "phone_number": "+15713520115",
        }
    )

    # ── Financial Profile (college student, $20/hr, 30 hrs/wk) ─
    pay_anchor_friday = now - timedelta(days=(now.weekday() - 4) % 7 + 7)
    pay_anchor_friday = pay_anchor_friday.replace(hour=10, minute=0, second=0, microsecond=0)

    await db.financial_profiles.insert_one(
        {
            "_id": profile_id,
            "user_id": user_id,
            "monthly_income": 2600.0,
            "monthly_budget": 2000.0,
            "hourly_rate": 20.0,
            "tax_rate": 0.18,
            "employment_type": "part-time",
            "employer_name": "Campus IT Help Desk",
            "pay_frequency": "biweekly",
            "last_pay_date": pay_anchor_friday,
            "category_budgets": {
                "food": 460,
                "transport": 95,
                "entertainment": 70,
                "shopping": 130,
                "utilities": 130,
                "subscriptions": 65,
            },
            "net_worth": 5370.0,
            "total_assets": 6050.0,
            "total_liabilities": 680.0,
            "savings_goal_monthly": 300.0,
            "financial_goals": [
                {"name": "Emergency Fund", "target_amount": 3000.0, "current_amount": 1500.0, "icon": "Shield"},
                {"name": "Spring Break Trip", "target_amount": 800.0, "current_amount": 340.0, "icon": "Plane"},
                {"name": "New Laptop Fund", "target_amount": 1200.0, "current_amount": 450.0, "icon": "Target"},
            ],
            "last_synced": None,
        }
    )

    # ── Accounts ──────────────────────────────────────────────
    uid = user_id
    accounts = [
        {
            "_id": checking_id,
            "user_id": uid,
            "name": "Wells Fargo Checking",
            "type": "checking",
            "balance": 1850.0,
            "currency": "USD",
            "institution_name": "Wells Fargo",
            "institution_logo_url": "wellsfargo.com",
            "is_primary_checking": True,
            "color": "#D71E28",
            "created_at": now,
            "is_active": True,
        },
        {
            "_id": savings_id,
            "user_id": uid,
            "name": "Wells Fargo Savings",
            "type": "savings",
            "balance": 4200.0,
            "currency": "USD",
            "institution_name": "Wells Fargo",
            "institution_logo_url": "wellsfargo.com",
            "is_primary_checking": False,
            "color": "#00A651",
            "created_at": now,
            "is_active": True,
        },
        {
            "_id": credit_id,
            "user_id": uid,
            "name": "Discover it Student",
            "type": "credit",
            "balance": -680.0,
            "currency": "USD",
            "institution_name": "Discover",
            "institution_logo_url": "discover.com",
            "is_primary_checking": False,
            "color": "#FF6600",
            "created_at": now,
            "is_active": True,
        },
    ]
    await db.accounts.insert_many(accounts)

    # ── Virtual Cards (one per subscription) ──────────────────
    checking_str = str(checking_id)
    card_specs = [
        ("Netflix", "4829", 15.00, 6.99, "red"),
        ("Spotify", "7712", 10.00, 5.99, "green"),
        ("Amazon Prime", "8837", 12.00, 7.49, "blue"),
        ("ChatGPT Plus", "3190", 25.00, 20.00, "purple"),
        ("Planet Fitness", "3351", 15.00, 10.00, "blue"),
        ("iCloud+", "1198", 3.00, 0.99, "gray"),
        ("Xbox Game Pass", "6644", 15.00, 10.99, "green"),
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

    # ── Subscriptions (student-priced) ────────────────────────
    sub_rows = [
        ("Netflix", 6.99, "streaming", 85, False, 6.99),
        ("Spotify", 5.99, "streaming", 95, False, 5.99),
        ("Amazon Prime", 7.49, "shopping", 80, False, 7.49),
        ("ChatGPT Plus", 20.00, "software", 92, False, 20.00),
        ("Planet Fitness", 10.00, "fitness", 35, True, 10.00),
        ("iCloud+", 0.99, "cloud", 90, False, 0.99),
        ("Xbox Game Pass", 10.99, "entertainment", 40, True, 10.99),
    ]
    sub_logo_domains = {
        "Netflix": "netflix.com",
        "Spotify": "spotify.com",
        "Amazon Prime": "amazon.com",
        "ChatGPT Plus": "openai.com",
        "Planet Fitness": "planetfitness.com",
        "iCloud+": "apple.com",
        "Xbox Game Pass": "xbox.com",
    }
    sub_docs = []
    sub_ids_by_name: dict[str, ObjectId] = {}
    for i, (name, amount, cat, usage, cancel, last_known) in enumerate(sub_rows):
        sid = ObjectId()
        sub_ids_by_name[name] = sid
        next_d = now + timedelta(days=3 + i * 4)
        sub_docs.append(
            {
                "_id": sid,
                "user_id": uid,
                "virtual_card_id": str(card_ids_by_merchant[name]),
                "name": name,
                "logo_url": sub_logo_domains.get(name),
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

    # ── Anomaly Alert: Netflix price hike $6.99 → $8.49 ──────
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
            "last_known_amount": 6.99,
            "incoming_amount": 8.49,
            "delta_pct": 21.5,
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
            "message": "Netflix tried to charge $8.49 \u2014 up 21.5% from $6.99",
            "is_read": False,
            "action_url": None,
            "related_entity_type": "subscription",
            "related_entity_id": str(netflix_sub_id),
            "created_at": now,
        }
    )

    # ── Transactions ──────────────────────────────────────────
    transactions: list[dict] = []
    y, m = now.year, now.month

    MERCHANT_DOMAINS: dict[str, str | None] = {
        "Netflix": "netflix.com",
        "Spotify": "spotify.com",
        "Amazon Prime": "amazon.com",
        "ChatGPT Plus": "openai.com",
        "Planet Fitness": "planetfitness.com",
        "iCloud+": "apple.com",
        "Xbox Game Pass": "xbox.com",
        "Amazon": "amazon.com",
        "Walmart": "walmart.com",
        "Aldi": None,
        "Kroger": "kroger.com",
        "Target": "target.com",
        "Starbucks": "starbucks.com",
        "Chipotle": "chipotle.com",
        "Domino's": "dominos.com",
        "McDonald's": "mcdonalds.com",
        "Taco Bell": "tacobell.com",
        "Chick-fil-A": "chick-fil-a.com",
        "Shell Gas": "shell.com",
        "BP Gas": "bp.com",
        "T-Mobile": "t-mobile.com",
        "DTE Energy": None,
        "Comcast Internet": "xfinity.com",
        "Campus IT - Payroll": None,
        "Rent - Maple Apartments": None,
        "Venmo": "venmo.com",
        "Best Buy": "bestbuy.com",
    }

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
                "merchant_logo_url": MERCHANT_DOMAINS.get(merchant),
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

    # --- Bi-weekly payroll ($1,200 net per paycheck) ---
    p = pay_anchor_friday
    while p > start:
        p -= timedelta(days=14)
    if p < start:
        p += timedelta(days=14)
    while p <= now:
        add_tx(p, 1200.0, "Campus IT - Payroll", "income", is_recurring=True,
               description="Bi-weekly payroll deposit")
        p += timedelta(days=14)

    # --- Rent: $875 on the 1st ---
    for month_offset in range(-2, 1):
        mm = m + month_offset
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        while mm > 12:
            mm -= 12
            yy += 1
        add_tx(_day_in_month(yy, mm, 1, 9), -875.0, "Rent - Maple Apartments", "utilities",
               is_recurring=True, description="Monthly rent (shared apartment)")

    # --- Subscription charges ---
    sub_charge_day = {
        "Spotify": 8, "ChatGPT Plus": 10, "iCloud+": 11,
        "Amazon Prime": 15, "Xbox Game Pass": 18,
    }
    sub_amounts = {
        "Spotify": 5.99, "ChatGPT Plus": 20.00, "iCloud+": 0.99,
        "Amazon Prime": 7.49, "Xbox Game Pass": 10.99,
    }
    for name, amt in sub_amounts.items():
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
                -amt, name, "subscription",
                is_recurring=True,
                virtual_card_id=str(card_ids_by_merchant[name]),
            )

    # Planet Fitness on the 5th
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
            _day_in_month(yy, mm, 5, 10), -10.00, "Planet Fitness", "subscription",
            is_recurring=True, virtual_card_id=str(card_ids_by_merchant["Planet Fitness"]),
        )

    # Netflix: $6.99 for prior months, then $8.49 anomaly this month
    netflix_anomaly_date = _day_in_month(y, m, min(12, now.day), 11)
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
            _day_in_month(yy, mm, 12, 11), -6.99, "Netflix", "subscription",
            is_recurring=True, virtual_card_id=str(netflix_card_id),
        )
    add_tx(
        netflix_anomaly_date, -8.49, "Netflix", "subscription",
        is_recurring=True, anomaly_flag=True, anomaly_alert_id=str(alert_id),
        virtual_card_id=str(netflix_card_id),
    )

    # --- Utilities (split with roommates) ---
    for month_offset in range(-2, 1):
        mm = m + month_offset
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        while mm > 12:
            mm -= 12
            yy += 1
        add_tx(_day_in_month(yy, mm, 20, 8), -28.0, "DTE Energy", "utilities",
               is_recurring=True, description="Electric bill (1/3 split)")
        add_tx(_day_in_month(yy, mm, 22, 8), -57.0, "Comcast Internet", "utilities",
               is_recurring=True, description="Internet bill (1/3 split)")

    # --- Phone bill ---
    for month_offset in range(-2, 1):
        mm = m + month_offset
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        while mm > 12:
            mm -= 12
            yy += 1
        add_tx(_day_in_month(yy, mm, 25, 9), -45.0, "T-Mobile", "utilities", is_recurring=True)

    # --- Groceries: Walmart, Aldi, Kroger ---
    grocery_merchants = ["Walmart", "Aldi", "Kroger"]
    for month_offset in range(-2, 1):
        mm = m + month_offset
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        while mm > 12:
            mm -= 12
            yy += 1
        _, last_d = monthrange(yy, mm)
        for trip in range(random.randint(8, 10)):
            day = random.randint(1, last_d)
            dt = datetime(yy, mm, day, random.randint(10, 19), 0, 0)
            merchant = random.choice(grocery_merchants)
            amt = round(random.uniform(18.0, 52.0), 2)
            add_tx(dt, -amt, merchant, "food", description="Groceries")

    # --- Dining out: Starbucks, Chipotle, Domino's, McDonald's, etc. ---
    dining_patterns = [
        ("Starbucks", 4.85, 7.25, 5),
        ("Chipotle", 9.50, 14.20, 4),
        ("Domino's", 8.99, 16.50, 2),
        ("McDonald's", 6.50, 12.80, 2),
        ("Taco Bell", 5.99, 11.50, 1),
        ("Chick-fil-A", 8.50, 13.75, 2),
    ]
    for month_offset in range(-2, 1):
        mm = m + month_offset
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        while mm > 12:
            mm -= 12
            yy += 1
        _, last_d = monthrange(yy, mm)
        for merchant, lo, hi, freq in dining_patterns:
            for _ in range(freq):
                day = random.randint(1, last_d)
                hour = random.randint(11, 21)
                dt = datetime(yy, mm, day, hour, random.randint(0, 59), 0)
                add_tx(dt, -round(random.uniform(lo, hi), 2), merchant, "food")

    # --- Gas: every 10 days ---
    gas_stations = ["Shell Gas", "BP Gas"]
    d = start + timedelta(days=3)
    while d <= now:
        station = random.choice(gas_stations)
        amt = round(random.uniform(28.0, 45.0), 2)
        add_tx(d, -amt, station, "transport")
        d += timedelta(days=random.randint(8, 12))

    # --- Shopping: Amazon, Target ---
    shop_days = [5, 22, 42, 58, 75]
    for i, sd in enumerate(shop_days):
        dt = start + timedelta(days=sd)
        if dt > now:
            break
        merchant = "Amazon" if i % 2 == 0 else "Target"
        lo, hi = (15.0, 45.0) if merchant == "Amazon" else (20.0, 60.0)
        add_tx(dt, -round(random.uniform(lo, hi), 2), merchant, "shopping")

    # --- Entertainment: occasional larger purchases ---
    ent_purchases = [
        (12, -65.0, "Ticketmaster", "Concert tickets"),
        (35, -14.99, "Steam", "Video game"),
        (50, -12.00, "AMC Theatres", "Movie night"),
        (70, -25.0, "Eventbrite", "Campus event"),
    ]
    for day_off, amt, merchant, desc in ent_purchases:
        dt = start + timedelta(days=day_off)
        if dt <= now:
            if merchant not in MERCHANT_DOMAINS:
                MERCHANT_DOMAINS[merchant] = None
            add_tx(dt, amt, merchant, "entertainment", description=desc)

    # --- Textbook / school supplies ---
    add_tx(start + timedelta(days=8), -42.99, "Amazon", "shopping",
           description="Textbook - Data Structures")
    add_tx(start + timedelta(days=45), -18.50, "Target", "shopping",
           description="School supplies")

    # --- Venmo splits (incoming from roommates for utilities) ---
    for month_offset in range(-2, 1):
        mm = m + month_offset
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        while mm > 12:
            mm -= 12
            yy += 1
        add_tx(_day_in_month(yy, mm, 21, 14), 28.0, "Venmo", "other",
               description="Roommate - electric split")

    transactions = [tx for tx in transactions if start <= tx["date"] <= now]
    transactions.sort(key=lambda x: x["date"])
    if transactions:
        await db.transactions.insert_many(transactions)

    # ── User Cards (for Card Optimizer feature) ───────────────
    user_cards = [
        {
            "_id": ObjectId(),
            "user_id": uid,
            "card_name": "Discover it Student Cash Back",
            "issuer": "Discover",
            "card_type": "credit",
            "last4": "4829",
            "base_reward_pct": 1.0,
            "category_bonuses": {},
            "quarterly_rotating": {"grocery": 5.0, "streaming": 5.0},
            "quarterly_label": "Q1 2026: Grocery Stores & Streaming",
            "quarterly_cap": 1500.0,
            "quarterly_spent": 82.0,
            "annual_fee": 0.0,
            "rewards_earned_ytd": 34.50,
            "is_default": False,
            "created_at": now,
        },
        {
            "_id": ObjectId(),
            "user_id": uid,
            "card_name": "Wells Fargo Active Cash",
            "issuer": "Wells Fargo",
            "card_type": "credit",
            "last4": "5521",
            "base_reward_pct": 2.0,
            "category_bonuses": {},
            "quarterly_rotating": {},
            "quarterly_label": None,
            "quarterly_cap": None,
            "quarterly_spent": 0.0,
            "annual_fee": 0.0,
            "rewards_earned_ytd": 52.80,
            "is_default": True,
            "created_at": now,
        },
        {
            "_id": ObjectId(),
            "user_id": uid,
            "card_name": "Wells Fargo Debit",
            "issuer": "Wells Fargo",
            "card_type": "debit",
            "last4": "9903",
            "base_reward_pct": 0.0,
            "category_bonuses": {},
            "quarterly_rotating": {},
            "quarterly_label": None,
            "quarterly_cap": None,
            "quarterly_spent": 0.0,
            "annual_fee": 0.0,
            "rewards_earned_ytd": 0.0,
            "is_default": False,
            "created_at": now,
        },
    ]
    await db.user_cards.insert_many(user_cards)

    # ── Daily Snapshots (30+ days of history) ─────────────────
    snapshots = []
    base_nw = 4800.0
    for day_offset in range(90, -1, -1):
        snap_date = (now - timedelta(days=day_offset)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        drift = (90 - day_offset) * 6.3 + random.uniform(-30, 30)
        nw = round(base_nw + drift, 2)
        day_of_month = snap_date.day
        spent_pace = round(day_of_month * 62.0 + random.uniform(-20, 20), 2)
        income_pace = 1200.0 if day_of_month > 14 else (2400.0 if day_of_month > 28 else 1200.0)
        snapshots.append({
            "_id": ObjectId(),
            "user_id": uid,
            "date": snap_date,
            "net_worth": nw,
            "checking_balance": round(1850 + random.uniform(-300, 400), 2),
            "month_spent": spent_pace,
            "month_income": income_pace,
            "monthly_budget": 2000.0,
        })
    await db.daily_snapshots.insert_many(snapshots)

    # ── Indexes ───────────────────────────────────────────────
    await db.users.create_index("email", unique=True)
    await db.daily_snapshots.create_index([("user_id", 1), ("date", -1)])
    await db.user_cards.create_index([("user_id", 1)])

    # ── Summary ───────────────────────────────────────────────
    user_count = await db.users.count_documents({})
    account_count = await db.accounts.count_documents({})
    card_count = await db.virtual_cards.count_documents({})
    sub_count = await db.subscriptions.count_documents({})
    txn_count = await db.transactions.count_documents({})
    alert_count = await db.anomaly_alerts.count_documents({})
    snapshot_count = await db.daily_snapshots.count_documents({})
    user_card_count = await db.user_cards.count_documents({})

    demo_token = create_access_token(str(user_id))

    print()
    print("=" * 60)
    print("VERAFUND DATABASE SEEDED SUCCESSFULLY")
    print("=" * 60)
    print(f"  Users:           {user_count}")
    print(f"  Accounts:        {account_count}")
    print(f"  Virtual Cards:   {card_count}")
    print(f"  Subscriptions:   {sub_count}")
    print(f"  Transactions:    {txn_count}")
    print(f"  Alerts:          {alert_count}")
    print(f"  Daily Snapshots: {snapshot_count}")
    print(f"  User Cards:      {user_card_count}")
    print()
    print(f"  USER ID: {user_id}")
    print()
    print("  Persona: Alex Chen, 21, CS junior")
    print("  Works:   Campus IT Help Desk, $20/hr, 30 hrs/wk")
    print("  Income:  ~$2,600/mo gross, ~$2,130 net")
    print()
    print("  Demo login credentials:")
    print("    Email:    alex@verafunddemo.com")
    print("    Password: demo123")
    print()
    print(f"  Demo JWT token (valid 24h):")
    print(f"    {demo_token}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed())
