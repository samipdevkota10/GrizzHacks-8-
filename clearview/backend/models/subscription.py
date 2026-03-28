from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Subscription(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(None, alias="_id")
    user_id: str
    virtual_card_id: str | None = None
    name: str
    logo_url: str | None = None
    amount: float
    billing_cycle: str = "monthly"
    next_billing_date: datetime
    category: str = ""
    status: str = "active"
    usage_score: int | None = None
    ai_cancel_recommendation: bool = False
    last_known_amount: float | None = None
    price_history: list[dict] = []
    created_at: datetime | None = None
