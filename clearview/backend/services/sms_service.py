"""Twilio SMS fallback — sends a text when a fraud call fails or isn't answered."""
import logging
import urllib.parse
import urllib.request
import urllib.error
import base64
import json

logger = logging.getLogger(__name__)


def _send_twilio_sms(account_sid: str, auth_token: str, from_number: str, to_number: str, body: str) -> bool:
    """Send an SMS via Twilio REST API using stdlib only (no twilio package needed)."""
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    data = urllib.parse.urlencode({"From": from_number, "To": to_number, "Body": body}).encode()
    credentials = base64.b64encode(f"{account_sid}:{auth_token}".encode()).decode()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Basic {credentials}")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            payload = json.loads(resp.read())
            sid = payload.get("sid", "")
            logger.info("SMS sent via Twilio: %s", sid)
            return bool(sid)
    except urllib.error.HTTPError as e:
        body_text = e.read().decode(errors="replace")
        logger.error("Twilio SMS HTTP error %s: %s", e.code, body_text)
        return False
    except Exception as exc:
        logger.error("Twilio SMS failed: %s", exc)
        return False


async def send_fraud_sms_fallback(
    to_number: str,
    merchant_name: str,
    amount: float,
    fraud_alert_id: str,
) -> bool:
    """
    Send a fraud alert SMS when the voice call fails or goes unanswered.
    Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in config.
    Returns True if sent, False if not configured or failed.
    """
    from config import settings

    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        logger.info("Twilio SMS not configured — skipping fallback SMS")
        return False

    body = (
        f"[VeraFund] Vera here. We flagged a suspicious ${abs(amount):,.2f} charge at {merchant_name}. "
        f"Vera tried to call you but couldn't reach you. "
        f"Log in to review and block: https://grizz-hacks-8.vercel.app/dashboard"
    )

    return _send_twilio_sms(
        account_sid=settings.TWILIO_ACCOUNT_SID,
        auth_token=settings.TWILIO_AUTH_TOKEN,
        from_number=settings.TWILIO_PHONE_NUMBER,
        to_number=to_number,
        body=body,
    )
