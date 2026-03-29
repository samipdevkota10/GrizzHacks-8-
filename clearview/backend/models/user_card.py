from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserCard(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(None, alias="_id")
    user_id: str
    card_name: str
    issuer: str
    card_type: str = "credit"
    last4: str
    base_reward_pct: float = 0.0
    category_bonuses: dict[str, float] = {}
    quarterly_rotating: dict[str, float] = {}
    quarterly_label: str | None = None
    quarterly_cap: float | None = None
    quarterly_spent: float = 0.0
    annual_fee: float = 0.0
    rewards_earned_ytd: float = 0.0
    is_default: bool = False
    created_at: datetime | None = None
