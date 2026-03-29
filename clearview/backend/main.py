import logging

from fastapi import FastAPI
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

for module_name in ["auth", "advisor", "cards", "alerts", "voice", "transactions", "vera_agent", "subscriptions", "blockchain", "plaid"]:
    try:
        mod = __import__(f"routers.{module_name}", fromlist=["router"])
        app.include_router(mod.router)
    except (ImportError, AttributeError) as exc:
        print(f"Skipped router {module_name}: {exc}")


@app.on_event("startup")
async def _ensure_indexes():
    from database import get_database
    db = get_database()
    try:
        await db.purchase_analyses.create_index([("user_id", 1), ("created_at", -1)])
        await db.dashboard_events.create_index([("user_id", 1), ("created_at", -1)])
    except Exception as exc:
        _logger.warning("Index creation skipped: %s", exc)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
