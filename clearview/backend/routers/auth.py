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


@router.post("/onboarding")
async def complete_onboarding(body: dict, user_id: str = Depends(get_current_user)):
    db = get_database()
    uid = ObjectId(user_id)

    user = await db.users.find_one({"_id": uid})
    if not user:
        raise HTTPException(404, "User not found")

    monthly_income = float(body.get("monthly_income", 0))
    employment_type = body.get("employment_type", "full_time")
    employer_name = body.get("employer_name", "")
    pay_frequency = body.get("pay_frequency", "biweekly")
    hourly_rate = float(body.get("hourly_rate", 0))
    tax_rate = float(body.get("tax_rate", 0.22))
    monthly_budget = float(body.get("monthly_budget", 0)) or max(monthly_income * 0.7, 1500)
    savings_goal_monthly = float(body.get("savings_goal_monthly", 0))
    phone_number = body.get("phone_number", "")
    currency = body.get("currency", "USD")

    financial_goals = []
    for g in body.get("financial_goals", []):
        financial_goals.append({
            "name": g.get("name", ""),
            "target_amount": float(g.get("target_amount", 0)),
            "current_amount": float(g.get("current_amount", 0)),
        })

    category_budgets = body.get("category_budgets", {})
    if not category_budgets and monthly_budget > 0:
        category_budgets = {
            "food": round(monthly_budget * 0.20),
            "transport": round(monthly_budget * 0.08),
            "entertainment": round(monthly_budget * 0.06),
            "shopping": round(monthly_budget * 0.10),
            "health": round(monthly_budget * 0.05),
            "utilities": round(monthly_budget * 0.15),
            "subscriptions": round(monthly_budget * 0.06),
            "other": round(monthly_budget * 0.05),
        }

    if hourly_rate <= 0 and monthly_income > 0:
        hours_per_pay = {"weekly": 40, "biweekly": 80, "semimonthly": 86.67, "monthly": 173.33}
        periods_per_month = {"weekly": 4.33, "biweekly": 2.167, "semimonthly": 2, "monthly": 1}
        hourly_rate = round(monthly_income / 173.33, 2)

    now = datetime.utcnow()
    profile_update = {
        "monthly_income": monthly_income,
        "monthly_budget": monthly_budget,
        "hourly_rate": hourly_rate,
        "tax_rate": tax_rate,
        "category_budgets": category_budgets,
        "savings_goal_monthly": savings_goal_monthly,
        "financial_goals": financial_goals,
        "last_synced": now,
    }

    profile_id = user.get("financial_profile_id")
    if profile_id:
        await db.financial_profiles.update_one(
            {"_id": ObjectId(profile_id)},
            {"$set": profile_update},
        )
    else:
        profile_doc = {
            "_id": ObjectId(),
            "user_id": uid,
            "net_worth": 0.0,
            "total_assets": 0.0,
            "total_liabilities": 0.0,
            **profile_update,
        }
        result = await db.financial_profiles.insert_one(profile_doc)
        profile_id = str(result.inserted_id)

    accounts = body.get("accounts", [])
    for acc in accounts:
        await db.accounts.insert_one({
            "_id": ObjectId(),
            "user_id": uid,
            "name": acc.get("name", "Account"),
            "type": acc.get("type", "checking"),
            "balance": float(acc.get("balance", 0)),
            "currency": currency,
            "institution_name": acc.get("institution", ""),
            "institution_logo_url": None,
            "is_primary_checking": acc.get("type") == "checking",
            "color": "#4F8EF7",
            "created_at": now,
            "is_active": True,
        })

    loans = body.get("loans", [])
    total_liabilities = 0.0
    for loan in loans:
        balance = float(loan.get("balance", 0))
        total_liabilities += balance
        await db.accounts.insert_one({
            "_id": ObjectId(),
            "user_id": uid,
            "name": loan.get("name", "Loan"),
            "type": "loan",
            "balance": -abs(balance),
            "currency": currency,
            "institution_name": loan.get("lender", ""),
            "institution_logo_url": None,
            "is_primary_checking": False,
            "color": "#FF4757",
            "created_at": now,
            "is_active": True,
            "apr": float(loan.get("rate", 0)),
            "monthly_payment": float(loan.get("monthly", 0)),
        })

    if total_liabilities > 0 and profile_id:
        await db.financial_profiles.update_one(
            {"_id": ObjectId(profile_id)},
            {"$set": {"total_liabilities": total_liabilities}},
        )

    user_update: dict = {
        "onboarding_complete": True,
        "updated_at": now,
        "financial_profile_id": str(profile_id) if profile_id else user.get("financial_profile_id"),
    }
    if phone_number:
        user_update["phone_number"] = phone_number
    if employer_name:
        user_update["employer_name"] = employer_name
    if employment_type:
        user_update["employment_type"] = employment_type
    if pay_frequency:
        user_update["pay_frequency"] = pay_frequency

    await db.users.update_one({"_id": uid}, {"$set": user_update})

    return {"status": "ok", "onboarding_complete": True}


@router.get("/me")
async def me(user_id: str = Depends(get_current_user)):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")
    return _safe_user(user)
