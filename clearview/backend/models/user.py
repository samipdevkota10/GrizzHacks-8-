from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FinancialProfile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(None, alias="_id")
    user_id: str
    monthly_income: float
    monthly_budget: float
    category_budgets: dict[str, float]
    net_worth: float
    total_assets: float
    total_liabilities: float
    savings_goal_monthly: float
    financial_goals: list[dict] = []
    last_synced: datetime | None = None


class User(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(None, alias="_id")
    email: str
    name: str
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    vera_character_id: str | None = None
    vera_name: str = "Vera"
    vera_voice_id: str | None = None
    vera_personality: str = "professional"
    financial_profile_id: str | None = None
    preferences: dict = {
        "currency": "USD",
        "theme": "dark",
        "creep_detection_threshold": 5.0,
        "notification_budget_threshold": 0.8,
    }
    onboarding_complete: bool = False
    solana_wallet_pubkey: str | None = None
