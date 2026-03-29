from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Always load .env from this package directory (not the shell cwd), so
# `python seed_data.py` / uvicorn work whether you run from repo root or backend/.
_BACKEND_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    MONGODB_URI: str
    MONGODB_DB_NAME: str = "clearview_db"
    GEMINI_API_KEY: str = ""  # Required for /advisor routes; seed only needs MongoDB
    GEMINI_MODEL: str = "gemini-1.5-flash"
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_AGENT_ID: str = ""
    ELEVENLABS_VERA_VOICE_ID: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_CARDHOLDER_ID: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    # Comma-separated *extra* CORS origins (merged with the base list below).
    # Do not use this to replace defaults — base always includes production Vercel + localhost.
    CORS_ORIGINS: str = ""
    # Regex for Vercel preview deploys — ALWAYS active, cannot be disabled via env.
    # Railway env vars cannot override this because we apply it unconditionally in main.py.
    CORS_ORIGIN_REGEX: str = r"https://.*\.vercel\.app$"

    ELEVENLABS_PHONE_NUMBER_ID: str = ""
    USER_PHONE_NUMBER: str = ""
    FRAUD_OUTBOUND_USE_FIRST_MESSAGE: bool = True
    BACKEND_PUBLIC_URL: str = ""
    PLAID_CLIENT_ID: str = ""
    PLAID_SECRET: str = ""
    PLAID_ENV: str = "sandbox"
    PLAID_PRODUCTS: str = "transactions"
    PLAID_COUNTRY_CODES: str = "US"

    # Twilio direct SMS (optional — for fallback when voice call fails)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""  # The +1 digits of the Twilio phone (not ElevenLabs phone resource id)

    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24

    model_config = SettingsConfigDict(
        env_file=_BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
    )

    def cors_allow_origins(self) -> list[str]:
        items = [
            "https://grizz-hacks-8.vercel.app",
            "https://grizzhacks-8-production.up.railway.app",
            self.FRONTEND_URL.strip().rstrip("/"),
            self.BACKEND_PUBLIC_URL.strip().rstrip("/") if self.BACKEND_PUBLIC_URL.strip() else "",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
        ]
        if self.CORS_ORIGINS.strip():
            items.extend(o.strip().rstrip("/") for o in self.CORS_ORIGINS.split(",") if o.strip())
        seen: set[str] = set()
        out: list[str] = []
        for o in items:
            if o and o not in seen:
                seen.add(o)
                out.append(o)
        return out


settings = Settings()
