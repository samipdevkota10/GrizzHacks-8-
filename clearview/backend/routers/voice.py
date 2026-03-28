from datetime import datetime
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from database import get_database
from objectid_util import parse_user_object_id
from services.elevenlabs_service import elevenlabs_service
from services.financial_context import build_financial_context

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/tts")
async def text_to_speech(body: dict):
    text = body.get("text", "")
    user_id = body.get("user_id")
    if not text:
        raise HTTPException(400, "text is required")

    result = await elevenlabs_service.text_to_speech(text)
    return result


@router.post("/session")
async def create_session(body: dict):
    user_id = body.get("user_id")
    mode = body.get("mode", "voice")

    if not user_id:
        raise HTTPException(400, "user_id is required")

    uid = parse_user_object_id(user_id)
    signed_url_data = await elevenlabs_service.get_signed_url()

    db = get_database()
    context = await build_financial_context(user_id)

    session_id = str(uuid4())
    conversation = {
        "user_id": uid,
        "session_id": session_id,
        "mode": mode,
        "messages": [],
        "financial_context_snapshot": context,
        "started_at": datetime.utcnow(),
    }
    result = await db.ai_conversations.insert_one(conversation)

    return {
        "session_token": session_id,
        "signed_url": signed_url_data.get("url", ""),
        "agent_id": elevenlabs_service.agent_id,
        "conversation_id": str(result.inserted_id),
        "mock": signed_url_data.get("mock", False),
    }


@router.delete("/session/{session_token}")
async def end_session(session_token: str):
    db = get_database()
    await db.ai_conversations.update_one(
        {"session_id": session_token},
        {"$set": {"ended_at": datetime.utcnow()}},
    )
    return {"message": "Session ended", "session_token": session_token}
