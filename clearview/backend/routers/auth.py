from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from pymongo.errors import OperationFailure

from database import get_database
from services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class GoalPayload(BaseModel):
    name: str = ""
    target_amount: float = 0
    current_amount: float = 0


class AccountPayload(BaseModel):
    name: str = ""
    type: str = "checking"
    balance: float = 0
    institution: str = ""


class LoanPayload(BaseModel):
    name: str = ""
    balance: float = 0
    rate: float = 0
    monthly: float = 0
    lender: str = ""


class CardPayload(BaseModel):
    name: str = ""
    last4: str = ""
    type: str = "debit"


class OnboardingPayload(BaseModel):
    monthly_income: float = 0
    employment_type: str = "full_time"
    employer_name: str = ""
    pay_frequency: str = "biweekly"
    hourly_rate: float = 0
    tax_rate: float = 0.22
    monthly_budget: float = 0
    savings_goal_monthly: float = 0
    phone_number: str = ""
    currency: str = "USD"
    financial_goals: list[GoalPayload] = Field(default_factory=list)
    category_budgets: dict = Field(default_factory=dict)
    accounts: list[AccountPayload] = Field(default_factory=list)
    cards: list[CardPayload] = Field(default_factory=list)
    loans: list[LoanPayload] = Field(default_factory=list)


class OnboardingDraftPayload(BaseModel):
    step: int = 0
    data: dict = Field(default_factory=dict)

_ATLAS_AUTH_MSG = (
    "Database authentication failed. Fix MONGODB_URI on the server: use the exact "
    "Atlas database username and password, and URL-encode special characters in "
    "the password (e.g. @ becomes %40)."
)


def _http_for_mongo(exc: OperationFailure) -> None:
    """Atlas/Railway misconfig: map PyMongo auth errors to HTTP so CORS headers apply."""
    code = getattr(exc, "code", None)
    low = str(exc).lower()
    if code == 8000 or "authentication failed" in low or "bad auth" in low:
        raise HTTPException(503, _ATLAS_AUTH_MSG) from exc
    raise exc


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

    try:
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
    except OperationFailure as e:
        _http_for_mongo(e)


@router.post("/login")
async def login(body: dict):
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        raise HTTPException(400, "email and password are required")

    db = get_database()
    try:
        user = await db.users.find_one({"email": email})
    except OperationFailure as e:
        _http_for_mongo(e)

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


def _default_category_budgets(monthly_budget: float) -> dict:
    return {
        "food": round(monthly_budget * 0.20),
        "transport": round(monthly_budget * 0.08),
        "entertainment": round(monthly_budget * 0.06),
        "shopping": round(monthly_budget * 0.10),
        "health": round(monthly_budget * 0.05),
        "utilities": round(monthly_budget * 0.15),
        "subscriptions": round(monthly_budget * 0.06),
        "other": round(monthly_budget * 0.05),
    }


@router.get("/onboarding/draft")
async def get_onboarding_draft(user_id: str = Depends(get_current_user)):
    db = get_database()
    uid = ObjectId(user_id)
    draft = await db.onboarding_sessions.find_one({"user_id": uid, "status": "draft"})
    if not draft:
        return {"step": 0, "data": {}, "updated_at": None}
    return {
        "step": int(draft.get("step", 0)),
        "data": draft.get("data", {}),
        "updated_at": draft.get("updated_at"),
    }


@router.patch("/onboarding/draft")
async def save_onboarding_draft(body: OnboardingDraftPayload, user_id: str = Depends(get_current_user)):
    db = get_database()
    uid = ObjectId(user_id)
    now = datetime.utcnow()
    await db.onboarding_sessions.update_one(
        {"user_id": uid, "status": "draft"},
        {
            "$set": {
                "step": body.step,
                "data": body.data,
                "updated_at": now,
            },
            "$setOnInsert": {
                "_id": ObjectId(),
                "created_at": now,
                "status": "draft",
            },
        },
        upsert=True,
    )
    return {"status": "ok"}


@router.post("/onboarding")
async def complete_onboarding(body: OnboardingPayload, user_id: str = Depends(get_current_user)):
    db = get_database()
    uid = ObjectId(user_id)
    user = await db.users.find_one({"_id": uid})
    if not user:
        raise HTTPException(404, "User not found")

    monthly_income = max(0.0, float(body.monthly_income))
    monthly_budget = float(body.monthly_budget) if body.monthly_budget > 0 else max(monthly_income * 0.7, 1500)
    hourly_rate = float(body.hourly_rate) if body.hourly_rate > 0 else (round(monthly_income / 173.33, 2) if monthly_income > 0 else 0.0)
    tax_rate = min(max(float(body.tax_rate), 0.0), 0.7)
    now = datetime.utcnow()

    financial_goals = [
        {
            "name": g.name.strip(),
            "target_amount": max(0.0, float(g.target_amount)),
            "current_amount": max(0.0, float(g.current_amount)),
        }
        for g in body.financial_goals
        if g.name.strip()
    ]
    category_budgets = body.category_budgets or _default_category_budgets(monthly_budget)

    profile_update = {
        "monthly_income": monthly_income,
        "monthly_budget": monthly_budget,
        "hourly_rate": hourly_rate,
        "tax_rate": tax_rate,
        "category_budgets": category_budgets,
        "savings_goal_monthly": max(0.0, float(body.savings_goal_monthly)),
        "financial_goals": financial_goals,
        "last_synced": now,
    }

    profile_id = user.get("financial_profile_id")
    if profile_id:
        await db.financial_profiles.update_one({"_id": ObjectId(profile_id)}, {"$set": profile_update})
    else:
        profile_doc = {"_id": ObjectId(), "user_id": uid, "net_worth": 0.0, "total_assets": 0.0, "total_liabilities": 0.0, **profile_update}
        result = await db.financial_profiles.insert_one(profile_doc)
        profile_id = str(result.inserted_id)

    # Merge + dedupe manual onboarding accounts
    for acc in body.accounts:
        name = acc.name.strip() or "Account"
        acc_type = (acc.type or "checking").strip().lower()
        institution = acc.institution.strip()
        balance = float(acc.balance or 0)
        query = {
            "user_id": uid,
            "source": {"$in": [None, "manual"]},
            "name": name,
            "type": acc_type,
            "institution_name": institution,
        }
        await db.accounts.update_one(
            query,
            {
                "$set": {
                    "balance": balance,
                    "currency": body.currency,
                    "institution_logo_url": None,
                    "is_primary_checking": acc_type == "checking",
                    "color": "#4F8EF7" if acc_type != "credit" else "#FF4757",
                    "is_active": True,
                    "updated_at": now,
                    "source": "manual",
                },
                "$setOnInsert": {
                    "_id": ObjectId(),
                    "created_at": now,
                    "user_id": uid,
                    "name": name,
                    "type": acc_type,
                    "institution_name": institution,
                },
            },
            upsert=True,
        )

    # Store user-declared cards as manual cards (no Stripe provisioning)
    for card in body.cards:
        name = card.name.strip() or "Card"
        last4 = "".join(ch for ch in card.last4 if ch.isdigit())[-4:]
        if not last4:
            continue
        card_type = "credit" if card.type == "credit" else "debit"
        await db.virtual_cards.update_one(
            {
                "user_id": uid,
                "source": {"$in": [None, "manual"]},
                "nickname": name,
                "last4": last4,
            },
            {
                "$set": {
                    "stripe_card_id": "",
                    "merchant_name": name,
                    "merchant_logo_url": None,
                    "merchant_category": card_type,
                    "exp_month": 12,
                    "exp_year": now.year + 3,
                    "status": "active",
                    "spending_limit_monthly": 100,
                    "spent_this_month": 0.0,
                    "last_known_amount": None,
                    "funding_account_id": None,
                    "color_scheme": "blue",
                    "paused_at": None,
                    "destroyed_at": None,
                    "total_charged_lifetime": 0.0,
                    "charge_count": 0,
                    "updated_at": now,
                    "source": "manual",
                },
                "$setOnInsert": {
                    "_id": ObjectId(),
                    "created_at": now,
                    "user_id": uid,
                    "nickname": name,
                    "last4": last4,
                },
            },
            upsert=True,
        )

    for loan in body.loans:
        name = loan.name.strip() or "Loan"
        lender = loan.lender.strip()
        balance = max(0.0, float(loan.balance or 0))
        query = {
            "user_id": uid,
            "source": {"$in": [None, "manual"]},
            "name": name,
            "type": "loan",
            "institution_name": lender,
        }
        await db.accounts.update_one(
            query,
            {
                "$set": {
                    "balance": -abs(balance),
                    "currency": body.currency,
                    "institution_logo_url": None,
                    "is_primary_checking": False,
                    "color": "#FF4757",
                    "is_active": True,
                    "apr": max(0.0, float(loan.rate or 0)),
                    "monthly_payment": max(0.0, float(loan.monthly or 0)),
                    "updated_at": now,
                    "source": "manual",
                },
                "$setOnInsert": {
                    "_id": ObjectId(),
                    "created_at": now,
                    "user_id": uid,
                    "name": name,
                    "type": "loan",
                    "institution_name": lender,
                },
            },
            upsert=True,
        )

    # Recompute totals from all active accounts
    accounts = await db.accounts.find({"user_id": uid, "is_active": True}).to_list(200)
    total_assets = round(sum(float(a.get("balance", 0)) for a in accounts if float(a.get("balance", 0)) > 0), 2)
    total_liabilities = round(abs(sum(float(a.get("balance", 0)) for a in accounts if float(a.get("balance", 0)) < 0)), 2)
    net_worth = round(total_assets - total_liabilities, 2)
    await db.financial_profiles.update_one(
        {"_id": ObjectId(profile_id)},
        {"$set": {"total_assets": total_assets, "total_liabilities": total_liabilities, "net_worth": net_worth}},
    )

    user_update: dict = {
        "onboarding_complete": True,
        "updated_at": now,
        "financial_profile_id": str(profile_id),
        "employment_type": body.employment_type,
        "pay_frequency": body.pay_frequency,
    }
    if body.phone_number:
        user_update["phone_number"] = body.phone_number
    if body.employer_name:
        user_update["employer_name"] = body.employer_name
    await db.users.update_one({"_id": uid}, {"$set": user_update})

    # Mark draft complete to preserve audit trail but stop resume prompts
    await db.onboarding_sessions.update_one(
        {"user_id": uid, "status": "draft"},
        {"$set": {"status": "completed", "completed_at": now, "updated_at": now}},
    )

    return {"status": "ok", "onboarding_complete": True}


@router.get("/me")
async def me(user_id: str = Depends(get_current_user)):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")
    return _safe_user(user)


@router.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    """Return user + financial profile merged for the profile editing page."""
    db = get_database()
    uid = ObjectId(user_id)
    user = await db.users.find_one({"_id": uid})
    if not user:
        raise HTTPException(404, "User not found")

    profile = None
    if user.get("financial_profile_id"):
        profile = await db.financial_profiles.find_one(
            {"_id": ObjectId(user["financial_profile_id"])}
        )

    accounts = await db.accounts.find({"user_id": uid, "is_active": True}).to_list(None)

    def _ser(doc):
        if doc is None:
            return {}
        out = {k: (str(v) if isinstance(v, ObjectId) else v) for k, v in doc.items()}
        return out

    return {
        "user": _safe_user(user),
        "financial_profile": _ser(profile),
        "accounts": [_ser(a) for a in accounts],
    }


@router.patch("/profile")
async def update_profile(body: dict, user_id: str = Depends(get_current_user)):
    """Update user info and/or financial profile fields."""
    db = get_database()
    uid = ObjectId(user_id)
    now = datetime.utcnow()

    user_fields = {}
    for field in ["name", "phone_number", "avatar_url", "vera_name", "vera_personality"]:
        if field in body:
            user_fields[field] = body[field]
    if user_fields:
        user_fields["updated_at"] = now
        await db.users.update_one({"_id": uid}, {"$set": user_fields})

    profile_fields = {}
    for field in ["monthly_income", "monthly_budget", "savings_goal_monthly",
                  "hourly_rate", "tax_rate", "financial_goals", "category_budgets"]:
        if field in body:
            profile_fields[field] = body[field]
    if profile_fields:
        user = await db.users.find_one({"_id": uid})
        if user and user.get("financial_profile_id"):
            await db.financial_profiles.update_one(
                {"_id": ObjectId(user["financial_profile_id"])},
                {"$set": {**profile_fields, "last_synced": now}},
            )

    return {"status": "ok"}
