from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Notification(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(None, alias="_id")
    user_id: str
    type: str
    title: str
    message: str
    is_read: bool = False
    action_url: str | None = None
    related_entity_type: str | None = None
    related_entity_id: str | None = None
    created_at: datetime | None = None
