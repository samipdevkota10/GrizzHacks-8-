from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from database import get_database
from services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _safe_user(doc: dict) -> dict:
    """Serialize a user doc for the client, stripping sensitive fields."""
    out = dict(doc)
    out["_id"] = str(out["_id"])
    out.pop("password_hash", None)
    for k, v in out.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
    return out


@router.post("/signup")
async def signup(body: dict):
    name = body.get("name", "").strip()
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        raise HTTPException(400, "email and password are required")
    if len(password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    db = get_database()

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(409, "An account with this email already exists")

    now = datetime.utcnow()
    user_doc = {
        "_id": ObjectId(),
        "email": email,
        "name": name or email.split("@")[0],
        "password_hash": hash_password(password),
        "avatar_url": None,
        "created_at": now,
        "updated_at": None,
        "vera_character_id": None,
        "vera_name": "Vera",
        "vera_voice_id": None,
        "vera_personality": "professional",
        "financial_profile_id": None,
        "preferences": {
            "currency": "USD",
            "theme": "dark",
            "creep_detection_threshold": 5.0,
            "notification_budget_threshold": 0.8,
        },
        "onboarding_complete": False,
        "solana_wallet_pubkey": None,
        "phone_number": None,
    }
    await db.users.insert_one(user_doc)

    profile_doc = {
        "_id": ObjectId(),
        "user_id": user_doc["_id"],
        "monthly_income": 0.0,
        "monthly_budget": 3500.0,
        "category_budgets": {},
        "net_worth": 0.0,
        "total_assets": 0.0,
        "total_liabilities": 0.0,
        "savings_goal_monthly": 0.0,
        "financial_goals": [],
        "last_synced": None,
    }
    await db.financial_profiles.insert_one(profile_doc)
    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"financial_profile_id": str(profile_doc["_id"])}},
    )

    user_id = str(user_doc["_id"])
    token = create_access_token(user_id)

    return {
        "token": token,
        "user_id": user_id,
        "user": _safe_user(user_doc),
    }


@router.post("/login")
async def login(body: dict):
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        raise HTTPException(400, "email and password are required")

    db = get_database()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(401, "Invalid email or password")

    stored_hash = user.get("password_hash")
    if not stored_hash or not verify_password(password, stored_hash):
        raise HTTPException(401, "Invalid email or password")

    user_id = str(user["_id"])
    token = create_access_token(user_id)

    return {
        "token": token,
        "user_id": user_id,
        "user": _safe_user(user),
    }


@router.get("/me")
async def me(user_id: str = Depends(get_current_user)):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")
    return _safe_user(user)
