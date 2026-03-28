from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AnomalyAlert(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(None, alias="_id")
    user_id: str
    subscription_id: str | None = None
    virtual_card_id: str
    merchant_name: str
    last_known_amount: float
    incoming_amount: float
    delta_pct: float
    threshold_pct: float = 5.0
    status: str = "pending"
    action_taken: str | None = None
    action_taken_at: datetime | None = None
    created_at: datetime | None = None
    is_read: bool = False
