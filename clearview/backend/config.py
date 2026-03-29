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
    # Comma-separated browser origins for CORS (e.g. Vercel prod + previews).
    # If empty, allows FRONTEND_URL plus local dev URLs below.
    CORS_ORIGINS: str = ""

    ELEVENLABS_PHONE_NUMBER_ID: str = ""
    USER_PHONE_NUMBER: str = ""
    FRAUD_AMOUNT_THRESHOLD: float = 200.0
    FRAUD_OUTBOUND_USE_FIRST_MESSAGE: bool = True
    BACKEND_PUBLIC_URL: str = ""

    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24

    model_config = SettingsConfigDict(
        env_file=_BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
    )

    def cors_allow_origins(self) -> list[str]:
        if self.CORS_ORIGINS.strip():
            items = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        else:
            items = [
                self.FRONTEND_URL.strip(),
                # Deployed Vercel app; keeps CORS working if Railway FRONTEND_URL is wrong
                "https://grizz-hacks-8.vercel.app",
                "http://localhost:3000",
                "http://localhost:3001",
            ]
        seen: set[str] = set()
        out: list[str] = []
        for o in items:
            if o and o not in seen:
                seen.add(o)
                out.append(o)
        return out


settings = Settings()
