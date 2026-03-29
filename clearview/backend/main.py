import logging

from fastapi import BackgroundTasks, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import Settings

_logger = logging.getLogger(__name__)
settings = Settings()
# Avoid /path/ → /path redirects that can downgrade to http and break CORS preflight POST flows.
app = FastAPI(title="VeraFund API", version="1.0.0", redirect_slashes=False)

_allowed_origins = settings.cors_allow_origins()
_origin_regex = r"https://.*\.vercel\.app$"

_cors_kwargs: dict = {
    "allow_origins": _allowed_origins,
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
    "allow_origin_regex": _origin_regex,
}

app.add_middleware(CORSMiddleware, **_cors_kwargs)

_logger.info("CORS allow_origins: %s", _allowed_origins)
_logger.info("CORS allow_origin_regex: %s", _origin_regex)

from routers import dashboard

app.include_router(dashboard.router)

for module_name in ["auth", "advisor", "cards", "alerts", "voice", "transactions", "vera_agent", "subscriptions", "blockchain", "plaid", "notifications", "card_optimizer", "predictions", "search"]:
    try:
        mod = __import__(f"routers.{module_name}", fromlist=["router"])
        app.include_router(mod.router)
        _logger.info("Registered router: %s", module_name)
    except Exception as exc:
        _logger.error("FAILED to register router %s: %s", module_name, exc, exc_info=True)
        print(f"Skipped router {module_name}: {exc}")


@app.on_event("startup")
async def _ensure_indexes():
    if settings.JWT_SECRET_KEY == "change-me-in-production":
        _logger.warning(
            "JWT_SECRET_KEY is set to the insecure default. "
            "Set a strong secret in your .env for production."
        )
    from database import get_database
    db = get_database()
    try:
        await db.purchase_analyses.create_index([("user_id", 1), ("created_at", -1)])
        await db.dashboard_events.create_index([("user_id", 1), ("created_at", -1)])
        await db.notifications.create_index([("user_id", 1), ("is_read", 1), ("created_at", -1)])
        await db.daily_snapshots.create_index([("user_id", 1), ("date", -1)])
        await db.user_cards.create_index([("user_id", 1)])
    except Exception as exc:
        _logger.warning("Index creation skipped: %s", exc)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "cors_origins": _allowed_origins,
        "cors_regex": _origin_regex,
    }


@app.post("/api/admin/seed")
async def run_seed():
    """Re-seed the database with demo data (destructive!)."""
    from seed_data import seed
    await seed()
    return {"status": "seeded"}


@app.post("/api/admin/test-fraud")
async def test_fraud(background_tasks: BackgroundTasks):
    """Inject a single high-risk fraudulent transaction and initiate the
    Vera fraud call SYNCHRONOUSLY so errors surface in the response.

    Returns full scoring breakdown + call result for debugging.
    """
    from datetime import datetime
    from bson import ObjectId
    from database import get_database
    from objectid_util import parse_user_object_id
    from services.fraud_detection import evaluate_transaction
    from services.vera_caller import initiate_fraud_call

    user_id = "69c8872cbab93b1d2a3387c0"
    db = get_database()
    uid = parse_user_object_id(user_id)
    now = datetime.utcnow()

    amount = -1250.00
    merchant = "CryptoVault-International.xyz"
    category = "other"

    detection = await evaluate_transaction(
        user_id=user_id,
        amount=amount,
        merchant_name=merchant,
        category=category,
    )

    tx_doc = {
        "_id": ObjectId(),
        "user_id": uid,
        "account_id": "",
        "virtual_card_id": None,
        "amount": amount,
        "currency": "USD",
        "merchant_name": merchant,
        "merchant_logo_url": None,
        "category": category,
        "subcategory": None,
        "description": "[TEST] Fraudulent charge for demo",
        "date": now,
        "is_recurring": False,
        "anomaly_flag": True,
        "anomaly_alert_id": None,
        "tags": ["test_fraud"],
        "ai_summary": None,
        "solana_receipt_tx": None,
        "created_at": now,
        "status": "pending_review",
    }
    await db.transactions.insert_one(tx_doc)
    tx_id = str(tx_doc["_id"])

    severity = (detection or {}).get("severity", "high")
    reason = (detection or {}).get("reason", "Test fraud transaction — forced high severity")
    risk_score = (detection or {}).get("risk_score", 99)
    signals = (detection or {}).get("signals", [])

    alert_doc = {
        "_id": ObjectId(),
        "user_id": uid,
        "transaction_id": ObjectId(tx_id),
        "virtual_card_id": None,
        "amount": amount,
        "merchant_name": merchant,
        "category": category,
        "reason": reason,
        "severity": "high",
        "risk_score": risk_score,
        "signals": signals,
        "status": "pending",
        "call_conversation_id": None,
        "call_sid": None,
        "call_initiated_at": None,
        "call_resolved_at": None,
        "resolution": None,
        "created_at": now,
    }
    await db.fraud_alerts.insert_one(alert_doc)
    fraud_alert_id = str(alert_doc["_id"])
    await db.transactions.update_one(
        {"_id": tx_doc["_id"]},
        {"$set": {"anomaly_alert_id": fraud_alert_id}},
    )

    call_result = None
    call_error = None
    try:
        call_result = await initiate_fraud_call(
            user_id=user_id,
            transaction_id=tx_id,
            fraud_alert_id=fraud_alert_id,
            amount=amount,
            merchant_name=merchant,
            category=category,
            reason=reason,
            severity="high",
        )
    except Exception as exc:
        call_error = f"{type(exc).__name__}: {exc}"

    return {
        "status": "test_fraud_executed",
        "transaction_id": tx_id,
        "fraud_alert_id": fraud_alert_id,
        "detection": detection,
        "detection_severity": severity,
        "detection_risk_score": risk_score,
        "call_result": call_result,
        "call_error": call_error,
    }
