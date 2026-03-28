from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Message(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    role: str
    content: str
    timestamp: datetime
    audio_url: str | None = None
    purchase_check: dict | None = None


class AIConversation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(None, alias="_id")
    user_id: str
    session_id: str
    mode: str = "text"
    messages: list[Message] = []
    financial_context_snapshot: dict = {}
    started_at: datetime
    ended_at: datetime | None = None
    duration_seconds: int | None = None
    summary: str | None = None
    key_topics: list[str] = []
