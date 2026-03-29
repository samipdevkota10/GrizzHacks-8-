from datetime import datetime
from uuid import uuid4
import logging

from bson import ObjectId
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from google.api_core.exceptions import ResourceExhausted

from database import get_database
from objectid_util import parse_user_object_id
from services.advisor_caller import initiate_advisor_call
from services.financial_context import build_financial_context
from services.gemini_service import gemini_service

router = APIRouter(prefix="/api/advisor", tags=["advisor"])
logger = logging.getLogger(__name__)


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
    if len(image_bytes) == 0:
        raise HTTPException(400, "Uploaded image is empty")
    context = await build_financial_context(user_id)
    try:
        result = await gemini_service.purchase_vision_check(image_bytes, context)
    except ResourceExhausted:
        raise HTTPException(429, "AI rate limit reached. Please wait a minute and try again.")
    except Exception as exc:
        logger.exception("purchase_check failed unexpectedly: %s", exc)
        raise HTTPException(502, "AI service temporarily unavailable. Please retry in a moment.")

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
        "confidence": result.get("confidence"),
        "corrected_by_user": False,
        "original_extraction": None,
        "correction_source": None,
        "created_at": now,
    }
    insert_result = await db.purchase_analyses.insert_one(analysis_doc)
    result["analysis_id"] = str(insert_result.inserted_id)

    return result


@router.patch("/purchase-analysis/{analysis_id}")
async def correct_purchase_analysis(analysis_id: str, body: dict):
    """Let the user correct product name or price on a past analysis."""
    db = get_database()
    try:
        doc = await db.purchase_analyses.find_one({"_id": ObjectId(analysis_id)})
    except Exception:
        raise HTTPException(400, "Invalid analysis_id format")

    if not doc:
        raise HTTPException(404, "Analysis not found")

    update: dict = {}
    if "product" in body:
        if not doc.get("original_extraction"):
            update["original_extraction"] = {
                "product": doc.get("product"),
                "price": doc.get("price"),
                "currency": doc.get("currency"),
            }
        update["product"] = body["product"]
    if "price" in body:
        if not doc.get("original_extraction") and "original_extraction" not in update:
            update["original_extraction"] = {
                "product": doc.get("product"),
                "price": doc.get("price"),
                "currency": doc.get("currency"),
            }
        update["price"] = body["price"]
    if "currency" in body:
        update["currency"] = body["currency"]

    if not update:
        raise HTTPException(400, "Nothing to update")

    update["corrected_by_user"] = True
    update["correction_source"] = "dashboard"

    await db.purchase_analyses.update_one(
        {"_id": ObjectId(analysis_id)},
        {"$set": update},
    )
    updated = await db.purchase_analyses.find_one({"_id": ObjectId(analysis_id)})
    return _serialize(updated)


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
    if len(image_bytes) == 0:
        raise HTTPException(400, "Uploaded image is empty")
    try:
        result = await gemini_service.scan_receipt(image_bytes)
    except ResourceExhausted:
        raise HTTPException(429, "AI rate limit reached. Please wait a minute and try again.")
    except Exception as exc:
        logger.exception("scan_receipt failed unexpectedly: %s", exc)
        raise HTTPException(502, "Receipt scanner temporarily unavailable. Please retry in a moment.")

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


# ── Advisor Voice Call Endpoints ──────────────────────────────


@router.post("/call/start")
async def start_advisor_call(body: dict):
    """Initiate a personalized financial advisor outbound call."""
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(400, "user_id is required")

    try:
        result = await initiate_advisor_call(user_id)
    except Exception as exc:
        logger.exception("Advisor call failed: %s", exc)
        raise HTTPException(502, f"Could not initiate call: {exc}")

    if not result.get("success") and not result.get("mock"):
        error = result.get("error", "Unknown error")
        raise HTTPException(400, error)

    return result


@router.post("/call-result")
async def advisor_call_result(body: dict):
    """Receive call completion data and trigger summary extraction."""
    conversation_id = body.get("conversation_id")
    status = body.get("status", "completed")
    transcript = body.get("transcript")
    duration_seconds = body.get("duration_seconds")
    provider_payload = body.get("provider_payload")

    if not conversation_id:
        raise HTTPException(400, "conversation_id is required")

    db = get_database()
    conv = await db.ai_conversations.find_one({"_id": ObjectId(conversation_id)})
    if not conv:
        conv = await db.ai_conversations.find_one({"session_id": conversation_id})
    if not conv:
        raise HTTPException(404, "Conversation not found")

    now = datetime.utcnow()
    update_fields: dict = {
        "ended_at": now,
        "status": status,
    }
    if duration_seconds is not None:
        update_fields["duration_seconds"] = duration_seconds
    if transcript:
        update_fields["transcript"] = transcript
    if provider_payload:
        update_fields["provider_payload"] = provider_payload

    if transcript and status == "completed":
        try:
            context = conv.get("financial_context_snapshot", {})
            summary_data = await gemini_service.summarize_advisor_call(transcript, context)
            if summary_data:
                update_fields["summary"] = summary_data.get("summary", "")
                update_fields["key_topics"] = summary_data.get("key_topics", [])
                update_fields["next_steps"] = summary_data.get("next_steps", [])
                update_fields["action_requests"] = summary_data.get("action_requests", [])
                update_fields["safety_flags"] = summary_data.get("safety_flags", [])
        except Exception as exc:
            logger.warning("Transcript summarization failed: %s", exc)
            update_fields["summary"] = "Call completed but summary generation failed."

    doc_id = conv["_id"]
    await db.ai_conversations.update_one(
        {"_id": doc_id},
        {"$set": update_fields},
    )

    return {
        "message": "Call result recorded",
        "conversation_id": str(doc_id),
        "summary_generated": "summary" in update_fields,
    }


@router.get("/calls/{user_id}")
async def get_advisor_calls(user_id: str, limit: int = 5):
    """List recent advisor phone calls for a user."""
    db = get_database()
    uid = parse_user_object_id(user_id)

    projection = {
        "_id": 1,
        "session_id": 1,
        "mode": 1,
        "status": 1,
        "started_at": 1,
        "ended_at": 1,
        "duration_seconds": 1,
        "phone_last4": 1,
        "summary": 1,
        "key_topics": 1,
        "next_steps": 1,
        "action_requests": 1,
        "safety_flags": 1,
    }

    calls = await db.ai_conversations.find(
        {"user_id": uid, "mode": "advisor_call"},
        projection,
    ).sort("started_at", -1).to_list(limit)

    return {"calls": [_serialize(c) for c in calls]}
