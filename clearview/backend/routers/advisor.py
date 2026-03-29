from datetime import datetime
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from database import get_database
from objectid_util import parse_user_object_id
from services.financial_context import build_financial_context
from services.gemini_service import gemini_service

router = APIRouter(prefix="/api/advisor", tags=["advisor"])


def _serialize(doc: dict) -> dict:
    if doc is None:
        return {}
    out = dict(doc)
    for k, v in out.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, list):
            out[k] = [_serialize(i) if isinstance(i, dict) else (str(i) if isinstance(i, ObjectId) else i) for i in v]
        elif isinstance(v, dict):
            out[k] = _serialize(v)
    return out


@router.post("/chat")
async def chat(body: dict):
    user_id = body.get("user_id")
    message = body.get("message")
    conversation_id = body.get("conversation_id")

    if not user_id or not message:
        raise HTTPException(400, "user_id and message are required")

    uid = parse_user_object_id(user_id)
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
            {"$push": {"messages": {"$each": new_messages}}, "$set": {"ended_at": now}},
        )
    else:
        session_id = str(uuid4())
        result = await db.ai_conversations.insert_one({
            "user_id": uid,
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

    uid = parse_user_object_id(user_id)
    image_bytes = await image.read()
    context = await build_financial_context(user_id)
    result = await gemini_service.purchase_vision_check(image_bytes, context)

    db = get_database()
    now = datetime.utcnow()

    analysis_doc = {
        "user_id": uid,
        "type": "purchase_check",
        "product": result.get("product", "Unknown"),
        "price": result.get("price", 0),
        "currency": result.get("currency", "USD"),
        "verdict": result.get("verdict", "THINK_TWICE"),
        "reasoning": result.get("reasoning", ""),
        "hours_of_work": result.get("hours_of_work", 0),
        "days_of_work": result.get("days_of_work", 0),
        "budget_impact_percent": result.get("budget_impact_percent", 0),
        "category_context": result.get("category_context", ""),
        "goal_delays": result.get("goal_delays", []),
        "alternatives": result.get("alternatives", []),
        "total_cost_note": result.get("total_cost_note"),
        "thirty_day_suggestion": result.get("thirty_day_suggestion", False),
        "financial_snapshot": {
            "net_hourly_rate": context.get("net_hourly_rate", 0),
            "discretionary_remaining": context.get("discretionary_remaining", 0),
            "monthly_budget": context.get("monthly_budget", 0),
            "checking_balance": context.get("checking_balance", 0),
        },
        "created_at": now,
    }
    insert_result = await db.purchase_analyses.insert_one(analysis_doc)
    result["analysis_id"] = str(insert_result.inserted_id)

    return result


@router.get("/purchase-history/{user_id}")
async def get_purchase_history(user_id: str, limit: int = 20):
    db = get_database()
    uid = parse_user_object_id(user_id)
    docs = await db.purchase_analyses.find(
        {"user_id": uid}
    ).sort("created_at", -1).to_list(limit)
    return {"analyses": [_serialize(d) for d in docs]}


@router.post("/scan-receipt")
async def scan_receipt(image: UploadFile = File(...), user_id: str = Form(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    uid = parse_user_object_id(user_id)
    image_bytes = await image.read()
    result = await gemini_service.scan_receipt(image_bytes)

    db = get_database()
    now = datetime.utcnow()
    scan_doc = {
        "user_id": uid,
        "type": "receipt_scan",
        **result,
        "transactions_created": False,
        "created_at": now,
    }
    insert_result = await db.receipt_scans.insert_one(scan_doc)
    result["scan_id"] = str(insert_result.inserted_id)

    return result


@router.post("/scan-receipt/{scan_id}/confirm")
async def confirm_receipt(scan_id: str, body: dict):
    """Create transactions from a confirmed receipt scan."""
    db = get_database()
    scan = await db.receipt_scans.find_one({"_id": ObjectId(scan_id)})
    if not scan:
        raise HTTPException(404, "Receipt scan not found")
    if scan.get("transactions_created"):
        raise HTTPException(400, "Transactions already created from this receipt")

    uid = scan["user_id"]
    now = datetime.utcnow()
    merchant = scan.get("merchant", "Unknown")
    total = scan.get("total", 0)

    checking = await db.accounts.find_one({"user_id": uid, "is_primary_checking": True})
    account_id = str(checking["_id"]) if checking else None

    tx_doc = {
        "_id": ObjectId(),
        "user_id": uid,
        "account_id": account_id,
        "virtual_card_id": None,
        "amount": -abs(total),
        "currency": "USD",
        "merchant_name": merchant,
        "merchant_logo_url": None,
        "category": scan.get("items", [{}])[0].get("category", "other") if scan.get("items") else "other",
        "subcategory": None,
        "description": f"Receipt scan: {len(scan.get('items', []))} items",
        "date": now,
        "is_recurring": False,
        "anomaly_flag": False,
        "anomaly_alert_id": None,
        "tags": ["receipt-scan"],
        "ai_summary": None,
        "solana_receipt_tx": None,
        "created_at": now,
    }
    await db.transactions.insert_one(tx_doc)
    await db.receipt_scans.update_one(
        {"_id": ObjectId(scan_id)},
        {"$set": {"transactions_created": True}},
    )

    return {"message": f"Transaction of ${abs(total):.2f} at {merchant} added.", "transaction_id": str(tx_doc["_id"])}


@router.post("/wishlist")
async def add_to_wishlist(body: dict):
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(400, "user_id is required")

    uid = parse_user_object_id(user_id)
    db = get_database()
    now = datetime.utcnow()

    doc = {
        "user_id": uid,
        "product": body.get("product", "Unknown"),
        "price": body.get("price", 0),
        "currency": body.get("currency", "USD"),
        "verdict": body.get("verdict", ""),
        "reasoning": body.get("reasoning", ""),
        "analysis_id": body.get("analysis_id"),
        "created_at": now,
        "purchased": False,
    }
    result = await db.wishlist.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    doc["user_id"] = str(uid)
    doc["created_at"] = now.isoformat()

    return doc


@router.get("/wishlist/{user_id}")
async def get_wishlist(user_id: str):
    db = get_database()
    uid = parse_user_object_id(user_id)
    docs = await db.wishlist.find(
        {"user_id": uid, "purchased": False}
    ).sort("created_at", -1).to_list(50)
    return {"items": [_serialize(d) for d in docs]}


@router.delete("/wishlist/{item_id}")
async def remove_from_wishlist(item_id: str):
    db = get_database()
    result = await db.wishlist.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Wishlist item not found")
    return {"message": "Removed from wishlist"}


@router.get("/conversations/{user_id}")
async def get_conversations(user_id: str, limit: int = 10):
    db = get_database()
    uid = parse_user_object_id(user_id)
    convs = await db.ai_conversations.find(
        {"user_id": uid}
    ).sort("started_at", -1).to_list(limit)

    return {"conversations": [_serialize(c) for c in convs]}
