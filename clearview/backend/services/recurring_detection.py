from __future__ import annotations

from datetime import datetime, timedelta
from statistics import mean


def detect_recurring_subscriptions(transactions: list[dict]) -> list[dict]:
    """
    Lightweight recurring detector:
    - outflows only
    - grouped by merchant + rounded amount bucket
    - at least 2 charges
    - average cadence around monthly (20-40 days)
    """
    groups: dict[tuple[str, int], list[dict]] = {}
    for tx in transactions:
        amount = float(tx.get("amount", 0))
        if amount >= 0:
            continue
        merchant = (tx.get("merchant_name") or "").strip()
        if not merchant:
            continue
        key = (merchant.lower(), int(round(abs(amount))))
        groups.setdefault(key, []).append(tx)

    recurring: list[dict] = []
    for (_, _), rows in groups.items():
        if len(rows) < 2:
            continue
        rows = sorted(rows, key=lambda x: x.get("date") or datetime.min)
        deltas: list[int] = []
        for i in range(1, len(rows)):
            prev = rows[i - 1].get("date")
            cur = rows[i].get("date")
            if isinstance(prev, datetime) and isinstance(cur, datetime):
                deltas.append((cur - prev).days)
        if not deltas:
            continue
        avg_delta = mean(deltas)
        if not (20 <= avg_delta <= 40):
            continue

        merchant = rows[-1].get("merchant_name", "Subscription")
        latest_amount = abs(float(rows[-1].get("amount", 0)))
        confidence = min(0.95, 0.55 + (len(rows) * 0.08))
        next_days = int(round(avg_delta))
        next_date = rows[-1]["date"].replace(microsecond=0) + timedelta(days=next_days)

        recurring.append(
            {
                "name": merchant,
                "amount": round(latest_amount, 2),
                "billing_cycle": "monthly",
                "next_billing_date": next_date,
                "category": "subscription",
                "usage_score": max(30, min(95, int(confidence * 100))),
                "ai_cancel_recommendation": latest_amount > 30,
                "confidence": round(confidence, 2),
                "tx_count": len(rows),
            }
        )
    return recurring
