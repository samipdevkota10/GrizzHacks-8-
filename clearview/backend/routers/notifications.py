from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import get_database
from objectid_util import parse_user_object_id

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _serialize(doc):
    if doc is None:
        return None
    out = dict(doc)
    for k, v in out.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
    return out


@router.get("/{user_id}")
async def list_notifications(user_id: str, unread_only: bool = False, limit: int = 30):
    db = get_database()
    uid = parse_user_object_id(user_id)
    query: dict = {"user_id": uid}
    if unread_only:
        query["is_read"] = False
    docs = await db.notifications.find(query).sort("created_at", -1).to_list(limit)
    return {"notifications": [_serialize(d) for d in docs]}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str):
    db = get_database()
    try:
        oid = ObjectId(notification_id)
    except Exception:
        raise HTTPException(400, "Invalid notification ID")
    result = await db.notifications.update_one(
        {"_id": oid},
        {"$set": {"is_read": True, "read_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Notification not found")
    return {"status": "ok"}


class MarkAllReadBody(BaseModel):
    user_id: str


@router.post("/mark-all-read")
async def mark_all_read(body: MarkAllReadBody):
    db = get_database()
    uid = parse_user_object_id(body.user_id)
    now = datetime.utcnow()
    result = await db.notifications.update_many(
        {"user_id": uid, "is_read": False},
        {"$set": {"is_read": True, "read_at": now}},
    )
    return {"status": "ok", "marked": result.modified_count}
