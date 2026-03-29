"""Orchestrator for personalized financial advisor outbound calls.

Unlike fraud calls (vera_caller.py) which verify a single transaction,
advisor calls are open-ended coaching sessions grounded in the user's
full financial snapshot."""

import logging
from datetime import datetime
from bson import ObjectId

from database import get_database
from objectid_util import parse_user_object_id
from services.elevenlabs_service import elevenlabs_service, normalize_phone_e164
from services.financial_context import build_financial_context

logger = logging.getLogger(__name__)

ADVISOR_CALL_PROMPT = """=== PERSONALIZED FINANCIAL ADVISOR CALL ===

You are Vera from VeraFund. This is a live phone call with {user_name}, who requested
a personal financial check-in. You already have their real account data below.

CRITICAL RULES:
1. Your FIRST sentences MUST reference at least 2 specific numbers from the snapshot.
2. Within the first 60 seconds, answer: "Where am I this month?" and "What is my biggest
   money risk this week?" using the data below.
3. NEVER give generic advice. Every recommendation must cite a dollar amount, category,
   or goal from the snapshot.
4. You may PROPOSE actions (freeze card, pause subscription, adjust budget) at any time.
5. You may ONLY EXECUTE an action if the user gives EXPLICIT verbal consent in this call
   (e.g. "yes do it", "go ahead", "freeze that card now").
6. If the user says "maybe", "I'm not sure", or anything ambiguous — acknowledge it,
   do NOT execute, and suggest they review it in the app later.
7. Keep the conversation warm, direct, and concise. You're a trusted friend who knows finance.
8. Refer to yourself as Vera, never as "an AI" or "assistant".

FINANCIAL SNAPSHOT (source of truth — use ONLY these numbers):
{context_text}

CONVERSATION GOALS (address in natural order based on user questions):
1. Budget pacing: They've spent ${month_spent:,.2f} of ${monthly_budget:,.2f} this month
   with ${discretionary_remaining:,.2f} discretionary left. Tell them if they're on track
   or need to slow down, and by how much per day.
2. Top risk: Their biggest category is {top_category} at ${top_category_amount:,.2f}.
   If it's > 30% of budget, flag it. If subscriptions total ${subscription_total_monthly:,.2f}/mo,
   mention whether any could be paused.
3. Goal progress: {goals_summary}

STYLE:
- Be specific: "You've spent $847 on dining — that's 34% of your budget" not "you spend a lot on food".
- Be actionable: "Cut dining by $200 this week" not "try to spend less".
- Short sentences on the phone. No walls of text.
- If the user asks about something not in the snapshot, say you don't have that data
  and suggest checking the app.

ACTIONS YOU CAN OFFER (only execute with explicit consent):
- Freeze a virtual card
- Flag a subscription for cancellation review
- Set a spending alert/reminder
- Create a budget adjustment suggestion

When the user is done or after ~5 minutes, wrap up with a 1-sentence summary of what
was discussed and what they should do next.
"""


def _goals_summary(financial_goals: list[dict]) -> str:
    if not financial_goals:
        return "No financial goals set yet — suggest they create one in the app."
    lines = []
    for g in financial_goals:
        current = g.get("current_amount", 0)
        target = g["target_amount"]
        remaining = target - current
        pct = (current / target * 100) if target > 0 else 0
        lines.append(
            f"  - {g['name']}: ${current:,.2f} / ${target:,.2f} "
            f"({pct:.0f}% done, ${remaining:,.2f} to go)"
        )
    return "\n".join(lines)


async def initiate_advisor_call(user_id: str) -> dict:
    """Build a personalized prompt from the user's full financial context
    and initiate an outbound ElevenLabs call for a coaching session."""

    db = get_database()
    uid = parse_user_object_id(user_id)

    user = await db.users.find_one({"_id": uid})
    if not user:
        return {"success": False, "error": "User not found", "error_code": "USER_NOT_FOUND"}

    from config import settings
    phone = user.get("phone_number") or settings.USER_PHONE_NUMBER
    if not phone:
        return {"success": False, "error": "No phone number on file", "error_code": "NO_PHONE"}

    normalized_phone = normalize_phone_e164(phone)
    if not normalized_phone:
        return {
            "success": False,
            "error": "Phone number could not be normalized to E.164. Update your profile with a valid number (e.g. +15551234567).",
            "error_code": "INVALID_PHONE",
        }

    context = await build_financial_context(user_id)
    user_name = context.get("user_name", "there")

    goals_text = _goals_summary(context.get("financial_goals", []))

    prompt = ADVISOR_CALL_PROMPT.format(
        user_name=user_name,
        context_text=context["context_text"],
        month_spent=context.get("month_spent", 0),
        monthly_budget=context.get("monthly_budget", 0),
        discretionary_remaining=context.get("discretionary_remaining", 0),
        top_category=context.get("top_category", "unknown"),
        top_category_amount=context.get("top_category_amount", 0),
        subscription_total_monthly=context.get("subscription_total_monthly", 0),
        goals_summary=goals_text,
    )

    dynamic_variables = {
        "call_type": "advisor_session",
        "customer_name": user_name,
        "checking_balance": f"{context.get('checking_balance', 0):,.2f}",
        "discretionary_remaining": f"{context.get('discretionary_remaining', 0):,.2f}",
        "monthly_budget": f"{context.get('monthly_budget', 0):,.2f}",
        "month_spent": f"{context.get('month_spent', 0):,.2f}",
        "top_category": context.get("top_category", "unknown"),
        "subscription_total_monthly": f"{context.get('subscription_total_monthly', 0):,.2f}",
    }

    disc = context.get("discretionary_remaining", 0)
    spent = context.get("month_spent", 0)
    budget = context.get("monthly_budget", 0)

    first_message = (
        f"Hi {user_name}, it's Vera from VeraFund. "
        f"You've spent ${spent:,.2f} of your ${budget:,.2f} budget this month, "
        f"so you have ${disc:,.2f} left for discretionary spending. "
        f"Want me to walk you through a quick game plan for the rest of the month?"
    )

    call_result = await elevenlabs_service.initiate_outbound_call(
        to_number=phone,
        prompt_override=prompt,
        first_message=first_message[:500],
        dynamic_variables=dynamic_variables,
    )

    phone_last4 = normalized_phone[-4:] if len(normalized_phone) >= 4 else normalized_phone

    if call_result.get("mock"):
        logger.warning("Advisor outbound skipped (mock) for user %s", user_id)
        return {
            "success": False,
            "mock": True,
            "error": call_result.get("message", "Outbound calling not configured"),
            "error_code": "OUTBOUND_NOT_CONFIGURED",
            "hint": (
                "Server needs ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID, and "
                "ELEVENLABS_PHONE_NUMBER_ID. In ElevenLabs, link a Twilio number "
                "and use that phone number’s id here."
            ),
            "phone_last4": phone_last4,
        }

    if call_result.get("invalid_phone"):
        return {
            "success": False,
            "error": call_result.get("message", "Invalid phone number"),
            "error_code": "INVALID_PHONE",
            "phone_last4": phone_last4,
        }

    if not call_result.get("success", True):
        return {
            "success": False,
            "error": call_result.get("message", "ElevenLabs could not start the call"),
            "error_code": "ELEVENLABS_API_ERROR",
            "hint": "See backend logs for the full ElevenLabs error. Check agent id, phone number id, and that your ElevenLabs account can place outbound calls.",
            "phone_last4": phone_last4,
        }

    session_id = call_result.get("conversation_id") or call_result.get("conversationId")
    if not session_id:
        logger.error("ElevenLabs advisor call missing conversation_id: %s", call_result)
        return {
            "success": False,
            "error": "No call session was created (missing conversation id from provider).",
            "error_code": "NO_CONVERSATION_ID",
            "phone_last4": phone_last4,
        }

    now = datetime.utcnow()
    conv_doc = {
        "user_id": uid,
        "session_id": session_id,
        "mode": "advisor_call",
        "status": "calling",
        "call_transport": "elevenlabs_outbound",
        "messages": [],
        "financial_context_snapshot": context,
        "started_at": now,
        "phone_last4": phone_last4,
        "call_conversation_id": session_id,
        "call_sid": call_result.get("callSid") or call_result.get("call_sid"),
        "to_number_e164": normalized_phone,
    }
    insert = await db.ai_conversations.insert_one(conv_doc)

    logger.info(
        "Advisor call initiated for user %s: conv=%s sid=%s",
        user_id, session_id, call_result.get("callSid"),
    )

    return {
        "success": True,
        "conversation_id": str(insert.inserted_id),
        "session_id": session_id,
        "status": "calling",
        "started_at": now.isoformat(),
        "phone_last4": phone_last4,
        "mock": False,
    }
