"""Dashboard search — fuzzy matching across transactions, subscriptions, and cards."""

import re
from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter

from database import get_database
from objectid_util import parse_user_object_id

router = APIRouter(prefix="/api/search", tags=["search"])


def _serialize(doc: dict) -> dict:
    if doc is None:
        return {}
    out = dict(doc)
    for k, v in out.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
    return out


def _parse_amount_filter(q: str) -> tuple[str, float | None, float | None]:
    """Extract 'over $X' / 'under $X' from query, return (cleaned_query, min_amt, max_amt)."""
    min_amt = max_amt = None
    m = re.search(r"over\s+\$?([\d.]+)", q, re.IGNORECASE)
    if m:
        min_amt = float(m.group(1))
        q = q[:m.start()] + q[m.end():]
    m = re.search(r"under\s+\$?([\d.]+)", q, re.IGNORECASE)
    if m:
        max_amt = float(m.group(1))
        q = q[:m.start()] + q[m.end():]
    return q.strip(), min_amt, max_amt


def _parse_date_filter(q: str, now: datetime) -> tuple[str, datetime | None]:
    """Extract 'this month', 'last week', 'today' from query."""
    lower = q.lower()
    since = None
    if "this month" in lower:
        since = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        q = re.sub(r"this\s+month", "", q, flags=re.IGNORECASE).strip()
    elif "last week" in lower:
        since = now - timedelta(days=7)
        q = re.sub(r"last\s+week", "", q, flags=re.IGNORECASE).strip()
    elif "today" in lower:
        since = now.replace(hour=0, minute=0, second=0, microsecond=0)
        q = re.sub(r"today", "", q, flags=re.IGNORECASE).strip()
    elif "last month" in lower:
        m = now.month - 1 if now.month > 1 else 12
        y = now.year if now.month > 1 else now.year - 1
        since = datetime(y, m, 1)
        q = re.sub(r"last\s+month", "", q, flags=re.IGNORECASE).strip()
    return q, since


@router.get("/{user_id}")
async def search(user_id: str, q: str = ""):
    if not q.strip():
        return {"results": []}

    db = get_database()
    uid = parse_user_object_id(user_id)
    now = datetime.utcnow()

    query, min_amt, max_amt = _parse_amount_filter(q)
    query, since = _parse_date_filter(query, now)
    query = query.strip()

    results = []

    # Search transactions
    tx_filter: dict = {"user_id": uid}
    if query:
        tx_filter["$or"] = [
            {"merchant_name": {"$regex": query, "$options": "i"}},
            {"category": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}},
        ]
    if since:
        tx_filter["date"] = {"$gte": since}
    txns = await db.transactions.find(tx_filter).sort("date", -1).to_list(20)

    for tx in txns:
        amt = abs(tx.get("amount", 0))
        if min_amt and amt < min_amt:
            continue
        if max_amt and amt > max_amt:
            continue
        results.append({
            "type": "transaction",
            "_id": str(tx["_id"]),
            "title": tx.get("merchant_name", ""),
            "subtitle": f"{tx.get('category', '')} · ${amt:.2f}",
            "amount": tx.get("amount", 0),
            "date": tx["date"].isoformat() if isinstance(tx.get("date"), datetime) else str(tx.get("date", "")),
            "route": "/dashboard/transactions",
        })

    # Search subscriptions
    if query:
        sub_filter = {"user_id": uid, "name": {"$regex": query, "$options": "i"}}
    else:
        sub_filter = {"user_id": uid}
    subs = await db.subscriptions.find(sub_filter).to_list(10)
    for sub in subs:
        results.append({
            "type": "subscription",
            "_id": str(sub["_id"]),
            "title": sub.get("name", ""),
            "subtitle": f"${sub.get('amount', 0):.2f}/mo · {sub.get('status', 'active')}",
            "amount": -sub.get("amount", 0),
            "date": None,
            "route": "/dashboard/bills",
        })

    # Search virtual cards
    if query:
        card_filter = {"user_id": uid, "$or": [
            {"nickname": {"$regex": query, "$options": "i"}},
            {"merchant_name": {"$regex": query, "$options": "i"}},
        ]}
    else:
        card_filter = {"user_id": uid}
    cards = await db.virtual_cards.find(card_filter).to_list(10)
    for card in cards:
        results.append({
            "type": "card",
            "_id": str(card["_id"]),
            "title": card.get("nickname", ""),
            "subtitle": f"····{card.get('last4', '')} · {card.get('status', 'active')}",
            "amount": None,
            "date": None,
            "route": "/dashboard/cards",
        })

    return {"results": results[:25]}
