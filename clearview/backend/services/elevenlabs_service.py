import logging
import base64
import re
import httpx
from config import settings

logger = logging.getLogger(__name__)


def normalize_phone_e164(phone: str | None) -> str | None:
    """Normalize stored phone numbers to E.164 for Twilio / ElevenLabs.

    Accepts formats like +15551234567, (555) 123-0123, 555-123-0123, 15551230123.
    Returns None if there are not enough digits."""
    if not phone or not str(phone).strip():
        return None
    raw = str(phone).strip()
    if raw.startswith("+"):
        digits = re.sub(r"\D", "", raw[1:])
        if len(digits) >= 10:
            return "+" + digits
        return None
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10:
        return "+1" + digits
    if len(digits) == 11 and digits.startswith("1"):
        return "+" + digits
    if len(digits) >= 10:
        return "+" + digits
    return None


class ElevenLabsService:
    BASE_URL = "https://api.elevenlabs.io/v1"

    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.voice_id = settings.ELEVENLABS_VERA_VOICE_ID
        self.agent_id = settings.ELEVENLABS_AGENT_ID
        self.phone_number_id = settings.ELEVENLABS_PHONE_NUMBER_ID

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def text_to_speech(self, text: str) -> dict:
        if not self.is_configured:
            return {"audio_base64": "", "duration_seconds": 0, "mock": True}

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/text-to-speech/{self.voice_id}",
                headers={
                    "xi-api-key": self.api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.8,
                        "style": 0.3,
                    },
                },
                timeout=30.0,
            )
            response.raise_for_status()
            audio_bytes = response.content
            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
            duration = len(audio_bytes) / (24000 * 2)
            return {
                "audio_base64": audio_b64,
                "duration_seconds": round(duration, 1),
            }

    async def get_signed_url(self) -> dict:
        if not self.is_configured or not self.agent_id:
            return {"url": "", "mock": True}

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/convai/conversation/get_signed_url",
                params={"agent_id": self.agent_id},
                headers={"xi-api-key": self.api_key},
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
            return {"url": data.get("signed_url", "")}

    @property
    def can_make_calls(self) -> bool:
        return bool(self.api_key and self.agent_id and self.phone_number_id)

    async def initiate_outbound_call(
        self,
        to_number: str,
        prompt_override: str,
        first_message: str | None = None,
        dynamic_variables: dict | None = None,
        tools: list[dict] | None = None,
    ) -> dict:
        """Initiate an outbound phone call via ElevenLabs + Twilio.

        ``dynamic_variables`` are merged into the agent context (use in dashboard
        as ``{{variable_name}}``) and reinforce facts alongside the prompt override.

        ``tools`` is an optional list of server-tool definitions (webhooks) that
        the agent can invoke during the live call.

        Returns the ElevenLabs response containing ``conversation_id``
        and ``callSid``, or a mock dict if credentials are missing.
        """
        normalized = normalize_phone_e164(to_number)
        if not normalized:
            logger.warning("Invalid phone number for outbound call: %r", to_number)
            return {
                "success": False,
                "message": (
                    "Invalid phone number. Save a valid number in your profile "
                    "(E.164 preferred, e.g. +15551234567)."
                ),
                "mock": False,
                "invalid_phone": True,
            }

        if not self.can_make_calls:
            logger.warning("ElevenLabs outbound call skipped — missing credentials")
            return {
                "success": False,
                "message": "Outbound calling not configured",
                "mock": True,
            }

        agent_override: dict = {"prompt": {"prompt": prompt_override}}
        if first_message:
            agent_override["first_message"] = first_message
        if tools:
            agent_override["tools"] = tools

        client_data: dict = {
            "conversation_config_override": {
                "agent": agent_override,
            }
        }
        if dynamic_variables:
            client_data["dynamic_variables"] = dynamic_variables

        payload = {
            "agent_id": self.agent_id,
            "agent_phone_number_id": self.phone_number_id,
            "to_number": normalized,
            "conversation_initiation_client_data": client_data,
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/convai/twilio/outbound-call",
                    headers={
                        "xi-api-key": self.api_key,
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=30.0,
                )
        except httpx.RequestError as exc:
            logger.exception("ElevenLabs outbound network error: %s", exc)
            return {
                "success": False,
                "message": f"Could not reach ElevenLabs: {exc!s}",
                "mock": False,
            }

        if response.status_code >= 400:
            try:
                err_body = response.json()
                msg = err_body.get("detail") or err_body.get("message") or str(err_body)
            except Exception:
                msg = (response.text or "")[:500] or f"HTTP {response.status_code}"
            logger.error(
                "ElevenLabs outbound HTTP %s: %s | phone=%s agent=%s phnum_id=%s",
                response.status_code,
                msg,
                normalized,
                self.agent_id,
                self.phone_number_id,
            )
            return {
                "success": False,
                "message": str(msg),
                "status_code": response.status_code,
                "mock": False,
                "debug": {
                    "to_number": normalized,
                    "agent_id": self.agent_id,
                    "phone_number_id": self.phone_number_id,
                },
            }

        try:
            data = response.json()
        except Exception as exc:
            logger.warning("ElevenLabs outbound: invalid JSON body: %s", exc)
            return {
                "success": False,
                "message": "Invalid response from ElevenLabs",
                "mock": False,
            }

        logger.info("Outbound call initiated: %s", data)
        data.setdefault("success", True)
        return data

    async def get_conversation(self, conversation_id: str) -> dict | None:
        """Fetch conversation details from ElevenLabs to check call status and transcript."""
        if not self.is_configured or not conversation_id:
            return None
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.BASE_URL}/convai/conversations/{conversation_id}",
                    headers={"xi-api-key": self.api_key},
                    timeout=15.0,
                )
            if resp.status_code >= 400:
                logger.warning("ElevenLabs get_conversation %s: HTTP %s", conversation_id, resp.status_code)
                return None
            return resp.json()
        except Exception as exc:
            logger.warning("ElevenLabs get_conversation error: %s", exc)
            return None


elevenlabs_service = ElevenLabsService()
