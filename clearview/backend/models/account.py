from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Account(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(None, alias="_id")
    user_id: str
    name: str
    type: str
    balance: float
    currency: str = "USD"
    institution_name: str = ""
    institution_logo_url: str | None = None
    is_primary_checking: bool = False
    color: str = "#4F8EF7"
    created_at: datetime | None = None
    is_active: bool = True
