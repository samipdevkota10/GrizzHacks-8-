from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException
from database import get_database
from objectid_util import parse_user_object_id
from services.stripe_service import stripe_service
from config import settings
import stripe as stripe_lib

router = APIRouter(prefix="/api/cards", tags=["cards"])

COLOR_CYCLE = ["blue", "red", "green", "purple"]


def serialize(doc):
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)
    return doc


async def _sync_stripe_cards(db, uid: ObjectId) -> None:
    """Pull all active cards from Stripe and upsert them into MongoDB."""
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_CARDHOLDER_ID:
        return
    try:
        stripe_lib.api_key = settings.STRIPE_SECRET_KEY
        result = stripe_lib.issuing.Card.list(
            cardholder=settings.STRIPE_CARDHOLDER_ID,
            limit=100,
        )
        for i, sc in enumerate(result.auto_paging_iter()):
            if sc.status == "canceled":
                # Mark destroyed in our DB if it was ever there
                await db.virtual_cards.update_one(
                    {"stripe_card_id": sc.id},
                    {"$set": {"status": "destroyed"}},
                )
                continue

            limit_cents = 0
            if sc.spending_controls and sc.spending_controls.spending_limits:
                limit_cents = sc.spending_controls.spending_limits[0].amount

            db_status = "paused" if sc.status == "inactive" else "active"

            nickname = sc.cardholder.name if sc.cardholder else f"Card {sc.last4}"

            await db.virtual_cards.update_one(
                {"stripe_card_id": sc.id},
                {
                    "$setOnInsert": {
                        "user_id": uid,
                        "stripe_card_id": sc.id,
                        "nickname": nickname,
                        "merchant_name": nickname,
                        "merchant_logo_url": None,
                        "merchant_category": sc.spending_controls.allowed_categories[0]
                            if sc.spending_controls and sc.spending_controls.allowed_categories
                            else "subscription",
                        "spent_this_month": 0.0,
                        "last_known_amount": None,
                        "funding_account_id": None,
                        "color_scheme": COLOR_CYCLE[i % len(COLOR_CYCLE)],
                        "created_at": datetime.utcfromtimestamp(sc.created),
                        "total_charged_lifetime": 0.0,
                        "charge_count": 0,
                    },
                    "$set": {
                        "last4": sc.last4,
                        "exp_month": sc.exp_month,
                        "exp_year": sc.exp_year,
                        "status": db_status,
                        "spending_limit_monthly": limit_cents / 100,
                        "paused_at": datetime.utcnow() if db_status == "paused" else None,
                        "destroyed_at": None,
                    },
                },
                upsert=True,
            )
    except Exception as e:
        # Don't crash the page if Stripe is unreachable
        print(f"[cards] Stripe sync error: {e}")


@router.get("/{user_id}")
async def get_cards(user_id: str):
    db = get_database()
    uid = parse_user_object_id(user_id)
    await _sync_stripe_cards(db, uid)
    cards = await db.virtual_cards.find({
        "user_id": uid,
        "stripe_card_id": {"$exists": True, "$nin": [None, ""]},
        "status": {"$ne": "destroyed"},
    }).to_list(50)
    return {"cards": [serialize(c) for c in cards]}


@router.post("")
async def create_card(body: dict):
    db = get_database()
    user_id = body["user_id"]
    uid = parse_user_object_id(user_id)

    stripe_card = await stripe_service.create_card(
        body.get("merchant_name", ""),
        body.get("spending_limit_monthly", 100),
    )
    
    card = {
        "user_id": uid,
        "stripe_card_id": stripe_card["id"],
        "nickname": body.get("nickname", body.get("merchant_name", "")),
        "merchant_name": body.get("merchant_name", ""),
        "merchant_logo_url": None,
        "merchant_category": body.get("merchant_category", ""),
        "last4": stripe_card["last4"],
        "exp_month": stripe_card["exp_month"],
        "exp_year": stripe_card["exp_year"],
        "status": "active",
        "spending_limit_monthly": body.get("spending_limit_monthly", 100),
        "spent_this_month": 0.0,
        "last_known_amount": None,
        "funding_account_id": body.get("funding_account_id"),
        "color_scheme": body.get("color_scheme", "blue"),
        "created_at": datetime.utcnow(),
        "paused_at": None,
        "destroyed_at": None,
        "total_charged_lifetime": 0.0,
        "charge_count": 0,
    }
    result = await db.virtual_cards.insert_one(card)
    card["_id"] = result.inserted_id
    return {"card": serialize(card)}


@router.patch("/{card_id}/pause")
async def pause_card(card_id: str):
    db = get_database()
    card = await db.virtual_cards.find_one({"_id": ObjectId(card_id)})
    if not card:
        raise HTTPException(404, "Card not found")
    
    new_status = "active" if card["status"] == "paused" else "paused"
    
    if new_status == "paused":
        await stripe_service.pause_card(card.get("stripe_card_id", ""))
        await db.virtual_cards.update_one(
            {"_id": ObjectId(card_id)},
            {"$set": {"status": "paused", "paused_at": datetime.utcnow()}},
        )
    else:
        await db.virtual_cards.update_one(
            {"_id": ObjectId(card_id)},
            {"$set": {"status": "active", "paused_at": None}},
        )
    
    updated = await db.virtual_cards.find_one({"_id": ObjectId(card_id)})
    return {"card": serialize(updated), "message": f"Card {'paused' if new_status == 'paused' else 'resumed'}"}


@router.delete("/{card_id}")
async def destroy_card(card_id: str):
    db = get_database()
    card = await db.virtual_cards.find_one({"_id": ObjectId(card_id)})
    if not card:
        raise HTTPException(404, "Card not found")
    
    await stripe_service.destroy_card(card.get("stripe_card_id", ""))
    await db.virtual_cards.update_one(
        {"_id": ObjectId(card_id)},
        {"$set": {"status": "destroyed", "destroyed_at": datetime.utcnow()}},
    )
    
    merchant = card.get("merchant_name", "This merchant")
    return {"message": f"{merchant} can never charge this card again. Ever.", "card_id": card_id}


@router.patch("/{card_id}/limit")
async def update_limit(card_id: str, body: dict):
    db = get_database()
    new_limit = body.get("spending_limit_monthly")
    if new_limit is None:
        raise HTTPException(400, "spending_limit_monthly required")
    
    card = await db.virtual_cards.find_one({"_id": ObjectId(card_id)})
    if not card:
        raise HTTPException(404, "Card not found")
    
    await stripe_service.update_limit(card.get("stripe_card_id", ""), new_limit)
    await db.virtual_cards.update_one(
        {"_id": ObjectId(card_id)},
        {"$set": {"spending_limit_monthly": new_limit}},
    )
    
    return {"message": f"Limit updated to ${new_limit:.2f}/month"}
