"""Orchestrator that builds a transaction-specific Vera prompt and
initiates an outbound phone call to the account holder."""

import logging
from datetime import datetime

from bson import ObjectId

from database import get_database
from objectid_util import parse_user_object_id
from services.elevenlabs_service import elevenlabs_service
from services.financial_context import build_financial_context

logger = logging.getLogger(__name__)

VERA_FRAUD_PROMPT = """You are Vera, {user_name}'s personal financial security advisor from Clearview.

You are making an urgent outbound phone call because a potentially suspicious transaction was
detected on their account. Here are the details:

FLAGGED TRANSACTION:
- Amount: ${amount:,.2f}
- Merchant: {merchant_name}
- Category: {category}
- Detection reason: {reason}
- Severity: {severity}

{context_text}

YOUR INSTRUCTIONS:
1. Greet {user_name} by name and identify yourself: "Hi {user_name}, this is Vera from Clearview."
2. Clearly describe the flagged transaction: the amount, merchant, and why it was flagged.
3. Ask {user_name} to confirm: "Did you authorize this purchase?"
4. If they say YES: Thank them, let them know the transaction is approved, and wish them a good day.
5. If they say NO: Tell them you are freezing the card immediately and flagging it for review.
   Reassure them that their account is protected.
6. Keep the conversation concise, warm, and professional. You are a trusted ally, not a robot.
7. If they ask questions about their account, use the financial snapshot below to answer.
8. End the call politely once the matter is resolved.

RULES:
- Never say "I'm an AI" — you are Vera, their financial advisor.
- Cite specific dollar amounts from the transaction and their account.
- Be direct and efficient — this is a security call, not a chat.
"""

VERA_FIRST_MESSAGE = (
    "Hi {user_name}, this is Vera from Clearview. I'm calling because we detected "
    "a transaction of ${amount:,.2f} at {merchant_name} on your account that looks "
    "unusual. Do you have a moment to verify this?"
)


async def initiate_fraud_call(
    user_id: str,
    transaction_id: str,
    fraud_alert_id: str,
    amount: float,
    merchant_name: str,
    category: str,
    reason: str,
    severity: str,
) -> dict:
    """Build a dynamic prompt from transaction + financial context and
    call the user via ElevenLabs outbound call."""

    db = get_database()
    uid = parse_user_object_id(user_id)

    user = await db.users.find_one({"_id": uid})
    if not user:
        return {"success": False, "message": "User not found"}

    from config import settings
    phone = user.get("phone_number") or settings.USER_PHONE_NUMBER
    if not phone:
        return {"success": False, "message": "No phone number on file for user"}

    user_name = user.get("name", "there")

    context = await build_financial_context(user_id)

    prompt = VERA_FRAUD_PROMPT.format(
        user_name=user_name,
        amount=abs(amount),
        merchant_name=merchant_name,
        category=category,
        reason=reason,
        severity=severity,
        context_text=context["context_text"],
    )

    first_message = VERA_FIRST_MESSAGE.format(
        user_name=user_name,
        amount=abs(amount),
        merchant_name=merchant_name,
    )

    call_result = await elevenlabs_service.initiate_outbound_call(
        to_number=phone,
        prompt_override=prompt,
    )

    now = datetime.utcnow()

    update_fields: dict = {
        "status": "calling",
        "call_initiated_at": now,
    }
    if call_result.get("conversation_id"):
        update_fields["call_conversation_id"] = call_result["conversation_id"]
    if call_result.get("callSid"):
        update_fields["call_sid"] = call_result["callSid"]

    await db.fraud_alerts.update_one(
        {"_id": ObjectId(fraud_alert_id)},
        {"$set": update_fields},
    )

    await db.ai_conversations.insert_one({
        "user_id": uid,
        "session_id": call_result.get("conversation_id", ""),
        "mode": "outbound_call",
        "messages": [],
        "financial_context_snapshot": context,
        "started_at": now,
        "fraud_alert_id": ObjectId(fraud_alert_id),
        "transaction_id": ObjectId(transaction_id),
    })

    logger.info(
        "Fraud call initiated for user %s, alert %s: %s",
        user_id, fraud_alert_id, call_result,
    )

    return {
        "success": call_result.get("success", not call_result.get("mock", False)),
        "conversation_id": call_result.get("conversation_id"),
        "call_sid": call_result.get("callSid"),
        "mock": call_result.get("mock", False),
    }
