"""Multi-signal fraud detection engine.

Scores every incoming transaction across 8 behavioral signals, producing
a composite risk score (0-100).  Replaces the old threshold-based system.

Risk levels:
  70+   HIGH   -> auto-flag + Vera call
  45-69 MEDIUM -> flag + notification only
  <45   LOW    -> auto-approve
"""

from __future__ import annotations

from datetime import datetime, timedelta
from statistics import mean, stdev

from bson import ObjectId

from database import get_database
from objectid_util import parse_user_object_id


SIGNAL_WEIGHTS = {
    "amount_zscore": 0.25,
    "merchant_familiarity": 0.20,
    "category_deviation": 0.15,
    "velocity": 0.15,
    "time_of_day": 0.10,
    "round_amount": 0.05,
    "balance_strain": 0.05,
    "recurring_disruption": 0.05,
}

HIGH_THRESHOLD = 70
MEDIUM_THRESHOLD = 45


def _signal(name: str, score: float, detail: str) -> dict:
    return {
        "name": name,
        "score": min(100, max(0, score)),
        "weight": SIGNAL_WEIGHTS[name],
        "detail": detail,
    }


async def _signal_amount_zscore(
    uid: ObjectId, abs_amount: float, db, now: datetime
) -> dict:
    """How many std-devs above the user's typical charge amount."""
    ninety_days = now - timedelta(days=90)
    txns = await db.transactions.find(
        {"user_id": uid, "amount": {"$lt": 0}, "date": {"$gte": ninety_days}},
        {"amount": 1},
    ).to_list(500)

    amounts = [abs(t["amount"]) for t in txns]
    if len(amounts) < 3:
        if abs_amount > 100:
            return _signal("amount_zscore", 70, f"${abs_amount:,.2f} with limited history")
        return _signal("amount_zscore", 30, "Limited transaction history")

    avg = mean(amounts)
    sd = stdev(amounts) if len(amounts) > 1 else avg * 0.5
    if sd < 1:
        sd = 1
    z = (abs_amount - avg) / sd
    score = min(100, max(0, z * 25))
    return _signal(
        "amount_zscore",
        score,
        f"${abs_amount:,.2f} is {z:.1f}σ from avg ${avg:,.2f}",
    )


async def _signal_merchant_familiarity(
    uid: ObjectId, merchant_name: str, category: str, db
) -> dict:
    """First-time merchants or unfamiliar categories score high."""
    tx_count = await db.transactions.count_documents(
        {"user_id": uid, "merchant_name": merchant_name}
    )

    if tx_count >= 10:
        return _signal("merchant_familiarity", 0, f"Established merchant ({tx_count} past txns)")
    if tx_count >= 5:
        return _signal("merchant_familiarity", 15, f"Familiar merchant ({tx_count} txns)")
    if tx_count >= 1:
        return _signal("merchant_familiarity", 35, f"Seen before ({tx_count} txns)")

    cat_count = await db.transactions.count_documents(
        {"user_id": uid, "category": category}
    )
    if cat_count == 0:
        return _signal(
            "merchant_familiarity", 100,
            f"First-ever transaction at {merchant_name} in unfamiliar category '{category}'",
        )
    return _signal(
        "merchant_familiarity", 75,
        f"First-ever transaction at {merchant_name}",
    )


async def _signal_category_deviation(
    uid: ObjectId, abs_amount: float, category: str, db
) -> dict:
    """Is this category already way over the user's budget for it?"""
    profile = await db.financial_profiles.find_one({"user_id": uid})
    budgets = profile.get("category_budgets", {}) if profile else {}
    cat_budget = budgets.get(category, 0)

    if cat_budget <= 0:
        return _signal("category_deviation", 20, f"No budget set for '{category}'")

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    pipeline = [
        {"$match": {"user_id": uid, "category": category, "amount": {"$lt": 0},
                     "date": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": {"$abs": "$amount"}}}},
    ]
    agg = await db.transactions.aggregate(pipeline).to_list(1)
    spent = agg[0]["total"] if agg else 0

    ratio = (spent + abs_amount) / cat_budget
    if ratio >= 3:
        return _signal("category_deviation", 90, f"Would push '{category}' to {ratio:.1f}x budget")
    if ratio >= 2:
        return _signal("category_deviation", 65, f"'{category}' at {ratio:.1f}x budget")
    if ratio >= 1.5:
        return _signal("category_deviation", 40, f"'{category}' at {ratio:.1f}x budget")
    return _signal("category_deviation", 10, f"'{category}' within budget ({ratio:.0%})")


async def _signal_velocity(uid: ObjectId, db, now: datetime) -> dict:
    """Multiple charges in a short window = card testing pattern."""
    ten_min_ago = now - timedelta(minutes=10)
    recent = await db.transactions.count_documents(
        {"user_id": uid, "date": {"$gte": ten_min_ago}, "amount": {"$lt": 0}}
    )
    if recent >= 5:
        return _signal("velocity", 100, f"{recent} charges in the last 10 minutes")
    if recent >= 3:
        return _signal("velocity", 85, f"{recent} charges in the last 10 minutes")
    if recent >= 2:
        return _signal("velocity", 45, f"{recent} charges in the last 10 minutes")
    return _signal("velocity", 0, "Normal transaction frequency")


async def _signal_time_of_day(
    uid: ObjectId, db, now: datetime
) -> dict:
    """Transactions at unusual hours for this user."""
    current_hour = now.hour

    ninety_days = now - timedelta(days=90)
    txns = await db.transactions.find(
        {"user_id": uid, "date": {"$gte": ninety_days}},
        {"date": 1},
    ).to_list(500)

    if len(txns) < 10:
        if 1 <= current_hour <= 5:
            return _signal("time_of_day", 60, f"Transaction at {current_hour}:00 with little history")
        return _signal("time_of_day", 10, "Limited history for time pattern")

    hour_counts = [0] * 24
    for t in txns:
        hour_counts[t["date"].hour] += 1
    total = sum(hour_counts)

    pct_at_hour = hour_counts[current_hour] / total if total > 0 else 0
    if pct_at_hour < 0.01 and 1 <= current_hour <= 5:
        return _signal("time_of_day", 80, f"Never transacts at {current_hour}:00")
    if pct_at_hour < 0.02:
        return _signal("time_of_day", 55, f"Rare hour ({pct_at_hour:.0%} of txns at {current_hour}:00)")
    if pct_at_hour < 0.05:
        return _signal("time_of_day", 25, f"Uncommon hour ({pct_at_hour:.1%} at {current_hour}:00)")
    return _signal("time_of_day", 0, f"Normal hour ({pct_at_hour:.0%} at {current_hour}:00)")


def _signal_round_amount(
    abs_amount: float, merchant_familiar: bool
) -> dict:
    """Exact round-dollar amounts at unknown merchants are suspicious."""
    is_round = abs_amount == int(abs_amount) and abs_amount >= 50
    if is_round and not merchant_familiar:
        return _signal("round_amount", 70, f"Exact ${abs_amount:.0f}.00 at new merchant")
    if is_round:
        return _signal("round_amount", 25, f"Round amount ${abs_amount:.0f}.00")
    return _signal("round_amount", 0, "Non-round amount")


async def _signal_balance_strain(
    uid: ObjectId, abs_amount: float, db
) -> dict:
    """Would this charge overdraft or leave dangerously low balance?"""
    checking = await db.accounts.find_one(
        {"user_id": uid, "is_primary_checking": True}
    )
    if not checking:
        return _signal("balance_strain", 30, "No checking account found")

    balance = checking.get("balance", 0)
    remaining = balance - abs_amount
    if remaining < 0:
        return _signal("balance_strain", 90, f"Would overdraft (balance: ${balance:,.2f})")
    if remaining < 100:
        return _signal("balance_strain", 60, f"Would leave only ${remaining:,.2f} in checking")
    return _signal("balance_strain", 0, f"Balance sufficient (${balance:,.2f})")


async def _signal_recurring_disruption(
    uid: ObjectId, merchant_name: str, abs_amount: float, db
) -> dict:
    """Is this an unexpected charge on a card with established recurring patterns?"""
    subs = await db.subscriptions.find(
        {"user_id": uid, "status": "active"}
    ).to_list(50)

    sub_merchants = {s.get("name", "").lower() for s in subs}
    if merchant_name.lower() in sub_merchants:
        matching = next(
            (s for s in subs if s.get("name", "").lower() == merchant_name.lower()),
            None,
        )
        if matching:
            known = matching.get("last_known_amount", matching.get("amount", 0))
            if known > 0 and abs(abs_amount - known) / known > 0.3:
                return _signal(
                    "recurring_disruption", 65,
                    f"Amount ${abs_amount:.2f} deviates 30%+ from usual ${known:.2f}",
                )
        return _signal("recurring_disruption", 0, "Matches known subscription")

    return _signal("recurring_disruption", 0, "Not a subscription merchant")


async def _compute_signals(
    uid: ObjectId,
    abs_amount: float,
    merchant_name: str,
    category: str,
    db,
    now: datetime | None = None,
) -> list[dict]:
    now = now or datetime.utcnow()

    merchant_sig = await _signal_merchant_familiarity(uid, merchant_name, category, db)
    merchant_familiar = merchant_sig["score"] < 50

    return [
        await _signal_amount_zscore(uid, abs_amount, db, now),
        merchant_sig,
        await _signal_category_deviation(uid, abs_amount, category, db),
        await _signal_velocity(uid, db, now),
        await _signal_time_of_day(uid, db, now),
        _signal_round_amount(abs_amount, merchant_familiar),
        await _signal_balance_strain(uid, abs_amount, db),
        await _signal_recurring_disruption(uid, merchant_name, abs_amount, db),
    ]


def _build_reason(signals: list[dict], composite: float) -> str:
    top = sorted(signals, key=lambda s: s["score"] * s["weight"], reverse=True)
    parts = []
    for s in top[:3]:
        if s["score"] > 20:
            parts.append(s["detail"])
    if not parts:
        parts.append("Multiple low-level anomalies detected")
    return f"Risk score {composite:.0f}/100 — " + "; ".join(parts) + "."


async def evaluate_transaction(
    user_id: str,
    amount: float,
    merchant_name: str,
    category: str,
    override_now: datetime | None = None,
) -> dict | None:
    """Score an incoming transaction across 8 behavioral signals.

    Returns a dict with severity, risk_score, signals, and reason when
    the transaction is suspicious, or None when it looks normal.
    """
    db = get_database()
    uid = parse_user_object_id(user_id)
    abs_amount = abs(amount)

    signals = await _compute_signals(uid, abs_amount, merchant_name, category, db, override_now)
    composite = sum(s["score"] * s["weight"] for s in signals)

    if composite >= HIGH_THRESHOLD:
        return {
            "severity": "high",
            "risk_score": round(composite, 1),
            "signals": signals,
            "reason": _build_reason(signals, composite),
        }
    elif composite >= MEDIUM_THRESHOLD:
        return {
            "severity": "medium",
            "risk_score": round(composite, 1),
            "signals": signals,
            "reason": _build_reason(signals, composite),
        }

    return None
