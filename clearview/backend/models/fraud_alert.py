from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FraudAlert(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(None, alias="_id")
    user_id: str
    transaction_id: str
    amount: float
    merchant_name: str
    category: str = ""
    reason: str
    severity: str = "medium"
    status: str = "pending"
    call_conversation_id: str | None = None
    call_sid: str | None = None
    call_initiated_at: datetime | None = None
    call_resolved_at: datetime | None = None
    resolution: str | None = None
    created_at: datetime | None = None
