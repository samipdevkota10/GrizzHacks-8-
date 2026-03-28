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

    model_config = SettingsConfigDict(
        env_file=_BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
