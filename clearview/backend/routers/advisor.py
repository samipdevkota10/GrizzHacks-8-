from datetime import datetime
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from database import get_database
from services.financial_context import build_financial_context
from services.gemini_service import gemini_service

router = APIRouter(prefix="/api/advisor", tags=["advisor"])


@router.post("/chat")
async def chat(body: dict):
    user_id = body.get("user_id")
    message = body.get("message")
    conversation_id = body.get("conversation_id")
    
    if not user_id or not message:
        raise HTTPException(400, "user_id and message are required")
    
    db = get_database()
    context = await build_financial_context(user_id)
    
    history = []
    if conversation_id:
        conv = await db.ai_conversations.find_one({"_id": ObjectId(conversation_id)})
        if conv:
            history = conv.get("messages", [])
    
    response_text = await gemini_service.chat(message, context, history)
    
    now = datetime.utcnow()
    new_messages = [
        {"role": "user", "content": message, "timestamp": now},
        {"role": "vera", "content": response_text, "timestamp": now},
    ]
    
    if conversation_id:
        await db.ai_conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$push": {"messages": {"$each": new_messages}}, "$set": {"ended_at": now}}
        )
    else:
        session_id = str(uuid4())
        result = await db.ai_conversations.insert_one({
            "user_id": ObjectId(user_id),
            "session_id": session_id,
            "mode": "text",
            "messages": new_messages,
            "financial_context_snapshot": context,
            "started_at": now,
            "ended_at": now,
        })
        conversation_id = str(result.inserted_id)
    
    return {
        "response": response_text,
        "conversation_id": conversation_id,
    }


@router.post("/purchase-check")
async def purchase_check(image: UploadFile = File(...), user_id: str = Form(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    
    image_bytes = await image.read()
    context = await build_financial_context(user_id)
    result = await gemini_service.purchase_vision_check(image_bytes, context)
    
    db = get_database()
    now = datetime.utcnow()
    conv_result = await db.ai_conversations.insert_one({
        "user_id": ObjectId(user_id),
        "session_id": str(uuid4()),
        "mode": "text",
        "messages": [{
            "role": "vera",
            "content": result["reasoning"],
            "timestamp": now,
            "purchase_check": result,
        }],
        "financial_context_snapshot": context,
        "started_at": now,
        "ended_at": now,
    })
    result["conversation_id"] = str(conv_result.inserted_id)
    return result


@router.get("/conversations/{user_id}")
async def get_conversations(user_id: str, limit: int = 10):
    db = get_database()
    convs = await db.ai_conversations.find(
        {"user_id": ObjectId(user_id)}
    ).sort("started_at", -1).to_list(limit)
    
    for c in convs:
        c["_id"] = str(c["_id"])
        c["user_id"] = str(c["user_id"])
        for msg in c.get("messages", []):
            if "timestamp" in msg and hasattr(msg["timestamp"], "isoformat"):
                msg["timestamp"] = msg["timestamp"].isoformat()
    
    return {"conversations": convs}
