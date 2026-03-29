"""Smart Card Optimizer — recommends the best card based on purchase category."""

from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from database import get_database
from objectid_util import parse_user_object_id

router = APIRouter(prefix="/api/card-optimizer", tags=["card-optimizer"])

CATEGORY_MAP = {
    "food": ["grocery", "food", "groceries"],
    "grocery": ["grocery", "food", "groceries"],
    "groceries": ["grocery", "food", "groceries"],
    "streaming": ["streaming", "subscription"],
    "subscription": ["streaming", "subscription"],
    "dining": ["dining", "restaurant", "food"],
    "gas": ["gas", "fuel", "transport"],
    "transport": ["gas", "fuel", "transport"],
    "entertainment": ["entertainment"],
    "shopping": ["shopping"],
}


def _effective_reward(card: dict, category: str, amount: float) -> tuple[float, str | None]:
    """Return (effective_pct, quarterly_info) for a card given a purchase category."""
    cat_lower = category.lower()
    matched_keys = CATEGORY_MAP.get(cat_lower, [cat_lower])

    # Check quarterly rotating categories first
    quarterly = card.get("quarterly_rotating", {})
    for key in matched_keys:
        if key in quarterly:
            cap = card.get("quarterly_cap")
            spent = card.get("quarterly_spent", 0)
            if cap and spent + amount > cap:
                remaining = max(0, cap - spent)
                blended = (remaining * quarterly[key] + (amount - remaining) * card.get("base_reward_pct", 0)) / amount if amount > 0 else 0
                info = f"{card.get('quarterly_label', 'Rotating')} — ${spent:.0f}/${cap:.0f} cap used"
                return round(blended, 2), info
            info = f"{card.get('quarterly_label', 'Rotating')} — ${spent:.0f}/{f'${cap:.0f}' if cap else 'no'} cap"
            return quarterly[key], info

    # Check permanent category bonuses
    bonuses = card.get("category_bonuses", {})
    for key in matched_keys:
        if key in bonuses:
            return bonuses[key], None

    return card.get("base_reward_pct", 0), None


@router.get("/{user_id}/recommend")
async def recommend_card(user_id: str, category: str = "other", amount: float = 10.0):
    db = get_database()
    uid = parse_user_object_id(user_id)
    cards = await db.user_cards.find({"user_id": uid}).to_list(20)

    if not cards:
        raise HTTPException(404, "No cards found for user")

    recommendations = []
    for card in cards:
        pct, q_info = _effective_reward(card, category, amount)
        cashback = round(amount * pct / 100, 2)
        recommendations.append({
            "card_name": card.get("card_name", ""),
            "issuer": card.get("issuer", ""),
            "last4": card.get("last4", ""),
            "card_type": card.get("card_type", "credit"),
            "effective_reward_pct": pct,
            "cashback_amount": cashback,
            "quarterly_info": q_info,
            "is_best": False,
        })

    recommendations.sort(key=lambda r: r["effective_reward_pct"], reverse=True)
    if recommendations:
        recommendations[0]["is_best"] = True

    return {"recommendations": recommendations, "category": category, "amount": amount}


@router.get("/{user_id}/weekly-digest")
async def weekly_digest(user_id: str):
    """Analyze last 7 days of transactions and find missed reward opportunities."""
    db = get_database()
    uid = parse_user_object_id(user_id)
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    txns = await db.transactions.find({
        "user_id": uid,
        "date": {"$gte": week_ago},
        "amount": {"$lt": 0},
    }).to_list(200)

    cards = await db.user_cards.find({"user_id": uid}).to_list(20)
    if not cards:
        return {"digest": {"missed_rewards": 0, "details": [], "total_spent": 0}}

    missed_total = 0.0
    details = []
    total_spent = 0.0

    # Group transactions by category
    by_cat: dict[str, float] = {}
    by_cat_count: dict[str, int] = {}
    for tx in txns:
        cat = tx.get("category", "other")
        amt = abs(tx["amount"])
        total_spent += amt
        by_cat[cat] = by_cat.get(cat, 0) + amt
        by_cat_count[cat] = by_cat_count.get(cat, 0) + 1

    for cat, spent in by_cat.items():
        best_pct = 0.0
        best_card = ""
        for card in cards:
            pct, _ = _effective_reward(card, cat, spent)
            if pct > best_pct:
                best_pct = pct
                best_card = card.get("card_name", "")

        if best_pct > 0:
            optimal_cb = spent * best_pct / 100
            missed_total += optimal_cb
            details.append({
                "category": cat,
                "spent": round(spent, 2),
                "transaction_count": by_cat_count[cat],
                "best_card": best_card,
                "best_pct": best_pct,
                "potential_cashback": round(optimal_cb, 2),
            })

    details.sort(key=lambda d: d["potential_cashback"], reverse=True)

    return {
        "digest": {
            "missed_rewards": round(missed_total, 2),
            "details": details[:5],
            "total_spent": round(total_spent, 2),
            "period": "last 7 days",
        }
    }


@router.get("/{user_id}/fee-roi")
async def fee_roi(user_id: str):
    """Show annual fee ROI for each card."""
    db = get_database()
    uid = parse_user_object_id(user_id)
    cards = await db.user_cards.find({"user_id": uid}).to_list(20)

    result = []
    for card in cards:
        fee = card.get("annual_fee", 0)
        earned = card.get("rewards_earned_ytd", 0)
        roi = earned - fee
        result.append({
            "card_name": card.get("card_name", ""),
            "issuer": card.get("issuer", ""),
            "annual_fee": fee,
            "rewards_earned_ytd": round(earned, 2),
            "net_roi": round(roi, 2),
            "status": "profit" if roi >= 0 else "loss",
        })

    return {"cards": result}
