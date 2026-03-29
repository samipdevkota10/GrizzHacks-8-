import asyncio
from datetime import UTC, datetime

from bson import ObjectId

from config import settings
from database import get_database
from services.stripe_service import stripe


def _map_status(stripe_status: str) -> str:
    if stripe_status == "active":
        return "active"
    if stripe_status == "inactive":
        return "paused"
    if stripe_status == "canceled":
        return "destroyed"
    return "active"


async def sync_cards_for_user(email: str = "alex@verafund.com") -> None:
    if not settings.STRIPE_SECRET_KEY:
        raise RuntimeError("STRIPE_SECRET_KEY missing.")
    if not settings.STRIPE_CARDHOLDER_ID:
        raise RuntimeError("STRIPE_CARDHOLDER_ID missing.")

    db = get_database()
    user = await db.users.find_one({"email": email})
    if not user:
        raise RuntimeError(f"User not found: {email}")
    uid = user["_id"]

    checking = await db.accounts.find_one({"user_id": uid, "type": "checking"})
    fallback_account_id = str(checking["_id"]) if checking else None

    stripe_cards = stripe.issuing.Card.list(cardholder=settings.STRIPE_CARDHOLDER_ID, limit=100).data

    inserted = 0
    updated = 0
    skipped_canceled = 0

    for sc in stripe_cards:
        if sc.status == "canceled":
            skipped_canceled += 1
            continue

        existing = await db.virtual_cards.find_one({"user_id": uid, "stripe_card_id": sc.id})
        monthly_limit = 100.0
        try:
            limits = (sc.spending_controls or {}).get("spending_limits") or []
            monthly = next((x for x in limits if x.get("interval") == "monthly"), None)
            if monthly and monthly.get("amount") is not None:
                monthly_limit = float(monthly["amount"]) / 100.0
        except Exception:
            monthly_limit = 100.0

        doc = {
            "user_id": uid,
            "stripe_card_id": sc.id,
            "nickname": (existing or {}).get("nickname") or f"Imported ••••{sc.last4}",
            "merchant_name": (existing or {}).get("merchant_name") or f"Stripe Card ••••{sc.last4}",
            "merchant_logo_url": (existing or {}).get("merchant_logo_url"),
            "merchant_category": (existing or {}).get("merchant_category") or "subscription",
            "last4": sc.last4,
            "exp_month": sc.exp_month,
            "exp_year": sc.exp_year,
            "status": _map_status(sc.status),
            "spending_limit_monthly": (existing or {}).get("spending_limit_monthly", monthly_limit),
            "spent_this_month": (existing or {}).get("spent_this_month", 0.0),
            "last_known_amount": (existing or {}).get("last_known_amount"),
            "funding_account_id": (existing or {}).get("funding_account_id") or fallback_account_id,
            "color_scheme": (existing or {}).get("color_scheme", "blue"),
            "created_at": (existing or {}).get("created_at")
            or datetime.fromtimestamp(sc.created, tz=UTC).replace(tzinfo=None),
            "paused_at": (existing or {}).get("paused_at"),
            "destroyed_at": (existing or {}).get("destroyed_at"),
            "total_charged_lifetime": (existing or {}).get("total_charged_lifetime", 0.0),
            "charge_count": (existing or {}).get("charge_count", 0),
        }

        if existing:
            await db.virtual_cards.update_one({"_id": existing["_id"]}, {"$set": doc})
            updated += 1
        else:
            doc["_id"] = ObjectId()
            await db.virtual_cards.insert_one(doc)
            inserted += 1

    total = await db.virtual_cards.count_documents({"user_id": uid})
    print(f"Synced cards for {email}")
    print(f"Inserted: {inserted}, Updated: {updated}, Skipped canceled on Stripe: {skipped_canceled}")
    print(f"Total cards in Mongo for user: {total}")


if __name__ == "__main__":
    asyncio.run(sync_cards_for_user())
