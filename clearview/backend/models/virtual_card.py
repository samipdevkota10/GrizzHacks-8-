from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VirtualCard(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(None, alias="_id")
    user_id: str
    stripe_card_id: str = ""
    nickname: str
    merchant_name: str
    merchant_logo_url: str | None = None
    merchant_category: str = ""
    last4: str
    exp_month: int = 12
    exp_year: int = 2028
    status: str = "active"
    spending_limit_monthly: float
    spent_this_month: float = 0.0
    last_known_amount: float | None = None
    funding_account_id: str | None = None
    color_scheme: str = "blue"
    created_at: datetime | None = None
    paused_at: datetime | None = None
    destroyed_at: datetime | None = None
    total_charged_lifetime: float = 0.0
    charge_count: int = 0
    solana_wallet: str | None = None
