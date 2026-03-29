import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import Settings

_logger = logging.getLogger(__name__)
settings = Settings()
app = FastAPI(title="VeraFund API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import dashboard

app.include_router(dashboard.router)

for module_name in ["auth", "advisor", "cards", "alerts", "voice", "transactions", "vera_agent", "subscriptions", "blockchain"]:
    try:
        mod = __import__(f"routers.{module_name}", fromlist=["router"])
        app.include_router(mod.router)
    except (ImportError, AttributeError) as exc:
        print(f"Skipped router {module_name}: {exc}")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
