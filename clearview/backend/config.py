from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    MONGODB_URI: str
    MONGODB_DB_NAME: str = "clearview_db"
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-1.5-flash"
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_AGENT_ID: str = ""
    ELEVENLABS_VERA_VOICE_ID: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_CARDHOLDER_ID: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
