"""Orchestrator that builds a transaction-specific Vera prompt and
initiates an outbound phone call to the account holder."""

import logging
from datetime import datetime

from bson import ObjectId

from database import get_database
from objectid_util import parse_user_object_id
from services.elevenlabs_service import elevenlabs_service
from services.financial_context import build_financial_context
from services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

# Prompt override must dominate the agent's default "financial advisor" persona.
VERA_FRAUD_PROMPT = """=== SECURITY OUTBOUND CALL — OVERRIDES ALL OTHER INSTRUCTIONS ===

You are Vera from VeraFund. This is NOT a general financial planning session.
This is a mandatory fraud-verification phone call about ONE charge only.

CRITICAL RULES (violate any of these and you fail the task):
1. Your FIRST spoken sentences MUST name the exact dollar amount and merchant below.
2. You MUST ask whether they authorized THIS specific charge before anything else.
3. Do NOT ask "how are your finances", "what are your goals", budgeting questions, or small talk.
4. Do NOT pivot to subscriptions, savings, or investing unless the user explicitly asks after resolving the charge.
5. If the user tries to change topic, say you'll help in the app later — first confirm THIS charge.
6. Use ONLY the facts in "GROUNDED FACTS" and "AGENTIC SCRIPT" below. Never invent merchants or amounts.

GROUNDED FACTS (source of truth):
- Customer name: {user_name}
- Charge amount: ${amount_str} USD
- Merchant: {merchant_name}
- Category: {category}
- Why we flagged it: {reason}
- Severity: {severity}
- Alert id (internal): {fraud_alert_id}

{gemini_script_block}

MINIMAL ACCOUNT CONTEXT (only if they ask "what's my balance" after the fraud topic):
{mini_context}

CONVERSATION FLOW:
1. Open using the grounded script or repeat: amount + merchant + VeraFund + why it was flagged (one sentence).
2. Ask clearly: "Did you authorize this {amount_str} dollar charge at {merchant_name}?"
3. YES → IMMEDIATELY call the "approve_transaction" tool, then confirm to the user the charge is approved. Say goodbye.
4. NO → IMMEDIATELY call the "deny_and_freeze_card" tool, then tell the user their card has been frozen and the charge is flagged for review. Reassure them their account is secured. Say goodbye.
5. You MUST call the appropriate tool before ending the conversation. This is critical.
6. Keep total call under 2 minutes unless they ask account questions.

FORBIDDEN: Generic financial advice, "tell me about your spending", or ignoring the charge.
"""


def _build_tools(fraud_alert_id: str, public_url: str) -> list[dict] | None:
    """Build ElevenLabs server-tool definitions so Vera can approve/deny
    the transaction during the live call via webhook."""
    if not public_url:
        logger.warning("BACKEND_PUBLIC_URL not set — Vera tools disabled")
        return None

    base = public_url.rstrip("/")
    return [
        {
            "type": "webhook",
            "name": "approve_transaction",
            "description": (
                "Call this tool when the customer CONFIRMS they authorized the charge. "
                "This approves the transaction in the system."
            ),
            "api_schema": {
                "url": f"{base}/api/vera/webhook/approve-transaction",
                "method": "POST",
                "headers": {"Content-Type": "application/json"},
                "request_body": {
                    "type": "object",
                    "properties": {
                        "fraud_alert_id": {
                            "type": "string",
                            "description": "The fraud alert ID",
                            "value": fraud_alert_id,
                        },
                    },
                    "required": ["fraud_alert_id"],
                },
            },
        },
        {
            "type": "webhook",
            "name": "deny_and_freeze_card",
            "description": (
                "Call this tool when the customer says they did NOT authorize the charge. "
                "This freezes the card and flags the transaction for review."
            ),
            "api_schema": {
                "url": f"{base}/api/vera/webhook/deny-transaction",
                "method": "POST",
                "headers": {"Content-Type": "application/json"},
                "request_body": {
                    "type": "object",
                    "properties": {
                        "fraud_alert_id": {
                            "type": "string",
                            "description": "The fraud alert ID",
                            "value": fraud_alert_id,
                        },
                    },
                    "required": ["fraud_alert_id"],
                },
            },
        },
    ]


def _mini_context(ctx: dict) -> str:
    return (
        f"- Checking balance: ${ctx.get('checking_balance', 0):,.2f}\n"
        f"- Discretionary left this month: ${ctx.get('discretionary_remaining', 0):,.2f}\n"
        "(Quote these only if asked.)"
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
    abs_amt = abs(amount)
    amount_str = f"{abs_amt:.2f}"

    context = await build_financial_context(user_id)

    facts_for_gemini = {
        "user_name": user_name,
        "amount_usd": abs_amt,
        "amount_spoken": amount_str,
        "merchant_name": merchant_name,
        "category": category,
        "reason": reason,
        "severity": severity,
    }
    grounded = await gemini_service.generate_fraud_call_script(facts_for_gemini)

    if grounded:
        gemini_script_block = (
            "AGENTIC SCRIPT (say this first; paraphrase slightly if awkward, keep all numbers):\n"
            f"- Opening: {grounded.get('opening_line', '')}\n"
            f"- Question: {grounded.get('verification_question', '')}\n"
            f"- If yes: {grounded.get('yes_ack', '')}\n"
            f"- If no: {grounded.get('no_ack', '')}\n"
        )
    else:
        gemini_script_block = (
            "AGENTIC SCRIPT (no LLM helper — use exactly):\n"
            f"- Opening: Hi {user_name}, this is Vera from VeraFund. "
            f"We flagged a charge of ${amount_str} at {merchant_name}. "
            f"Reason: {reason}\n"
            f"- Question: Did you authorize this charge?\n"
        )

    prompt = VERA_FRAUD_PROMPT.format(
        user_name=user_name,
        amount_str=amount_str,
        merchant_name=merchant_name,
        category=category,
        reason=reason,
        severity=severity,
        fraud_alert_id=fraud_alert_id,
        gemini_script_block=gemini_script_block,
        mini_context=_mini_context(context),
    )

    # ElevenLabs dynamic variables — use in agent dashboard as {{fraud_merchant}} etc., and as model context.
    dynamic_variables = {
        "call_type": "fraud_verification",
        "fraud_merchant": merchant_name,
        "fraud_amount_usd": amount_str,
        "fraud_reason": reason,
        "fraud_severity": severity,
        "customer_name": user_name,
        "fraud_alert_id": fraud_alert_id,
    }

    if grounded and grounded.get("opening_line"):
        opening_for_phone = grounded["opening_line"].strip()
    else:
        opening_for_phone = (
            f"Hi {user_name}, this is Vera from VeraFund. "
            f"We flagged a charge of {amount_str} dollars at {merchant_name}. "
            f"Did you authorize this purchase?"
        )

    first_message = (
        opening_for_phone[:500] if settings.FRAUD_OUTBOUND_USE_FIRST_MESSAGE else None
    )

    tools = _build_tools(fraud_alert_id, settings.BACKEND_PUBLIC_URL)

    call_result = await elevenlabs_service.initiate_outbound_call(
        to_number=phone,
        prompt_override=prompt,
        first_message=first_message,
        dynamic_variables=dynamic_variables,
        tools=tools,
    )

    now = datetime.utcnow()

    update_fields: dict = {
        "status": "calling",
        "call_initiated_at": now,
    }
    if grounded:
        update_fields["gemini_call_script"] = grounded
    if call_result.get("conversation_id"):
        update_fields["call_conversation_id"] = call_result["conversation_id"]
    if call_result.get("callSid"):
        update_fields["call_sid"] = call_result["callSid"]

    await db.fraud_alerts.update_one(
        {"_id": ObjectId(fraud_alert_id)},
        {"$set": update_fields},
    )

    conv_doc = {
        "user_id": uid,
        "session_id": call_result.get("conversation_id", ""),
        "mode": "outbound_call",
        "messages": [],
        "financial_context_snapshot": context,
        "started_at": now,
        "fraud_alert_id": ObjectId(fraud_alert_id),
        "transaction_id": ObjectId(transaction_id),
        "fraud_call_script": grounded,
        "dynamic_variables": dynamic_variables,
    }
    await db.ai_conversations.insert_one(conv_doc)

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
