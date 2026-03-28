from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Transaction(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(None, alias="_id")
    user_id: str
    account_id: str
    virtual_card_id: str | None = None
    amount: float
    currency: str = "USD"
    merchant_name: str
    merchant_logo_url: str | None = None
    category: str
    subcategory: str | None = None
    description: str | None = None
    date: datetime
    is_recurring: bool = False
    anomaly_flag: bool = False
    anomaly_alert_id: str | None = None
    tags: list[str] = []
    ai_summary: str | None = None
    solana_receipt_tx: str | None = None
    created_at: datetime | None = None
