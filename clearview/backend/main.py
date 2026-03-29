import logging

from fastapi import BackgroundTasks, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import Settings

_logger = logging.getLogger(__name__)
settings = Settings()
# Avoid /path/ → /path redirects that can downgrade to http and break CORS preflight POST flows.
app = FastAPI(title="VeraFund API", version="1.0.0", redirect_slashes=False)

_cors_kwargs: dict = {
    "allow_origins": settings.cors_allow_origins(),
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if settings.CORS_ORIGIN_REGEX.strip():
    _cors_kwargs["allow_origin_regex"] = settings.CORS_ORIGIN_REGEX.strip()

app.add_middleware(CORSMiddleware, **_cors_kwargs)

from routers import dashboard

app.include_router(dashboard.router)

for module_name in ["auth", "advisor", "cards", "alerts", "voice", "transactions", "vera_agent", "subscriptions", "blockchain", "plaid", "notifications", "card_optimizer", "predictions", "search"]:
    try:
        mod = __import__(f"routers.{module_name}", fromlist=["router"])
        app.include_router(mod.router)
    except (ImportError, AttributeError) as exc:
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
    return {"status": "ok"}


@app.post("/api/admin/seed")
async def run_seed():
    """Re-seed the database with demo data (destructive!)."""
    from seed_data import seed
    await seed()
    return {"status": "seeded"}


@app.post("/api/admin/test-fraud")
async def test_fraud(background_tasks: BackgroundTasks):
    """Inject 3 mock fraudulent transactions to exercise the fraud pipeline.

    1. High-risk: unknown merchant + huge amount + late night
    2. High-risk: velocity attack (3 rapid charges in 2 min)
    3. Medium-risk: first-time merchant + unusual category
    """
    from datetime import datetime, timedelta
    from routers.transactions import ingest_transaction

    user_id = "69c8872cbab93b1d2a3387c0"
    results = []

    # --- Test 1: Unknown merchant, big amount, 3am ---
    r1 = await ingest_transaction(
        {
            "user_id": user_id,
            "amount": -890.00,
            "merchant_name": "ShadyElectronics.xyz",
            "category": "shopping",
            "description": "[TEST] Unknown merchant, large amount, late night",
        },
        background_tasks,
    )
    results.append({"test": "high_risk_unknown_merchant", **r1})

    # --- Test 2: Velocity attack — 3 rapid $49.99 charges ---
    for i in range(3):
        r = await ingest_transaction(
            {
                "user_id": user_id,
                "amount": -49.99,
                "merchant_name": "QuickMart International",
                "category": "shopping",
                "description": f"[TEST] Velocity attack charge {i + 1}/3",
            },
            background_tasks,
        )
        results.append({"test": f"high_risk_velocity_{i + 1}", **r})

    # --- Test 3: Medium-risk — first-time luxury merchant ---
    r3 = await ingest_transaction(
        {
            "user_id": user_id,
            "amount": -165.00,
            "merchant_name": "LuxuryWatch.co",
            "category": "shopping",
            "description": "[TEST] First-time merchant, unusual category",
        },
        background_tasks,
    )
    results.append({"test": "medium_risk_first_time", **r3})

    return {"status": "test_transactions_injected", "results": results}
